import { useState, useEffect, useLayoutEffect, useRef } from 'react'

const PUSH_MS = 420
const TAB_MS = 260

export default function ScreenTransition({ screenKey, direction, children }) {
  const [exitLayer, setExitLayer] = useState(null)
  const [exitDir, setExitDir] = useState(null)
  const prevContentRef = useRef(null)
  const prevKeyRef = useRef(screenKey)
  const timerRef = useRef(null)

  // Runs synchronously BEFORE browser paint — no flicker
  useLayoutEffect(() => {
    if (screenKey === prevKeyRef.current) return

    if (prevContentRef.current) {
      setExitLayer(prevContentRef.current)
      setExitDir(direction)
    }

    prevKeyRef.current = screenKey

    if (timerRef.current) clearTimeout(timerRef.current)
    const ms = direction === 'tab' ? TAB_MS : PUSH_MS
    timerRef.current = setTimeout(() => {
      setExitLayer(null)
      setExitDir(null)
    }, ms + 50)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [screenKey, direction])

  // Capture content AFTER each commit for the next transition
  useEffect(() => {
    prevContentRef.current = children
  })

  const animating = exitLayer !== null

  const enterCls = animating
    ? (exitDir === 'push' ? 'ios-push-enter' : exitDir === 'pop' ? 'ios-pop-enter' : 'ios-tab-enter')
    : ''
  const exitCls = animating
    ? (exitDir === 'push' ? 'ios-push-exit' : exitDir === 'pop' ? 'ios-pop-exit' : 'ios-tab-exit')
    : ''

  return (
    <div style={{ position: 'relative', flex: '1 1 0%', overflow: 'hidden' }}>
      {animating && (
        <div
          key="exit"
          className={exitCls}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {exitLayer}
        </div>
      )}
      <div
        key={animating ? 'enter-' + screenKey : 'current'}
        className={enterCls}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {children}
      </div>
    </div>
  )
}
