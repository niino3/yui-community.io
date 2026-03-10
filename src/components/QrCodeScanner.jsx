import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

/**
 * yui 用 QR ペイロード形式: { "to": "0x...", "amount": "15", "token": "YUI" }
 */
export function parseYuiQrPayload(decodedText) {
  try {
    const data = JSON.parse(decodedText)
    if (data.to && (data.amount !== undefined || data.amount === '')) {
      return {
        to: data.to,
        amount: String(data.amount || '0'),
        token: data.token || 'YUI',
      }
    }
  } catch {
    // プレーンアドレスの場合
    if (/^0x[a-fA-F0-9]{40}$/.test(decodedText.trim())) {
      return { to: decodedText.trim(), amount: '0', token: 'YUI' }
    }
  }
  return null
}

const READER_ID = 'yui-qr-reader'

export default function QrCodeScanner({ onScan, onError }) {
  const [status, setStatus] = useState('idle') // idle | starting | scanning | error
  const [errorMsg, setErrorMsg] = useState('')
  const scannerRef = useRef(null)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  useEffect(() => {
    const scanner = new Html5Qrcode(READER_ID)
    scannerRef.current = scanner

    Html5Qrcode.getCameras()
      .then(cameras => {
        if (!cameras?.length) {
          setErrorMsg('カメラが見つかりません')
          setStatus('error')
          return
        }
        const backCam = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.includes('後')) || cameras[0]
        setStatus('starting')
        return scanner.start(
          backCam.id,
          { fps: 10, qrbox: { width: 250, height: 250 } },
          decodedText => {
            const payload = parseYuiQrPayload(decodedText)
            if (payload) {
              scanner.stop().catch(() => { })
              onScanRef.current?.(payload)
            }
          },
          () => { }
        )
      })
      .then(() => setStatus('scanning'))
      .catch(err => {
        setErrorMsg(err?.message || 'カメラを起動できませんでした')
        setStatus('error')
        onError?.(err)
      })

    return () => {
      scanner.stop().catch(() => { })
      scanner.clear().catch(() => { })
      scannerRef.current = null
    }
  }, [onError])

  return (
    <div className="w-full flex flex-col items-center">
      <div id={READER_ID} className="w-full max-w-xs overflow-hidden rounded-2xl" />
      {status === 'starting' && (
        <p className="mt-4 text-white text-sm">カメラを起動中...</p>
      )}
      {status === 'error' && (
        <p className="mt-4 text-red-400 text-sm">{errorMsg}</p>
      )}
      {status === 'scanning' && (
        <p className="mt-4 text-white text-sm">QRコードを枠内に入れてください</p>
      )}
    </div>
  )
}
