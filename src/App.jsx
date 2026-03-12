import { useState, useEffect } from 'react'
import { useCommunity } from './context/CommunityContext'
import BottomNav from './components/BottomNav'
import ScreenTransition from './components/ScreenTransition'
import Onboarding from './screens/Onboarding'
import Home from './screens/Home'
import TaskList from './screens/TaskList'
import TaskDetail from './screens/TaskDetail'
import TaskPost from './screens/TaskPost'
import WorkComplete from './screens/WorkComplete'
import ApproveWork from './screens/ApproveWork'
import QRScan from './screens/QRScan'
import Profile from './screens/Profile'
import Equipment from './screens/Equipment'
import EquipmentDetail from './screens/EquipmentDetail'
import EarthCare from './screens/EarthCare'
import AdminDashboard from './screens/AdminDashboard'
import TokenTransfer from './screens/TokenTransfer'
import TenantAdmin from './screens/TenantAdmin'
import LandingPage from './screens/LandingPage'

const TAB_SCREENS = ['home', 'tasks', 'qr', 'equipment', 'profile']

export default function App() {
  const { community, loading, slug } = useCommunity()
  const isAdminMode = new URLSearchParams(window.location.search).get('admin') === 'true'
  const [screen, setScreen] = useState(isAdminMode ? 'tenant-admin' : 'onboarding')
  const [stack, setStack] = useState([])
  const [params, setParams] = useState({})
  const [activeTab, setActiveTab] = useState('home')
  const [direction, setDirection] = useState('push')

  // ランディングページを表示するかどうかを判定
  const showLandingPage = !loading && !slug && !community

  function navigate(nextScreen, nextParams = {}) {
    setDirection('push')
    setStack(prev => [...prev, { screen, params, activeTab }])
    setScreen(nextScreen)
    setParams(nextParams)
    if (TAB_SCREENS.includes(nextScreen)) {
      setActiveTab(nextScreen)
    }
  }

  function goBack() {
    if (stack.length > 0) {
      setDirection('pop')
      const prev = stack[stack.length - 1]
      setStack(s => s.slice(0, -1))
      setScreen(prev.screen)
      setParams(prev.params)
      setActiveTab(prev.activeTab)
    }
  }

  function switchTab(tab) {
    if (tab === activeTab && screen === tab) return
    setDirection('tab')
    setStack([])
    setScreen(tab)
    setActiveTab(tab)
    setParams({})
  }

  const showBottomNav = screen !== 'onboarding' && TAB_SCREENS.includes(screen)

  const navProps = { navigate, goBack }

  const renderScreen = () => {
    switch (screen) {
      case 'onboarding': return <Onboarding {...navProps} />
      case 'home': return <Home {...navProps} />
      case 'tasks': return <TaskList {...navProps} />
      case 'task-detail': return <TaskDetail {...navProps} params={params} />
      case 'task-post': return <TaskPost {...navProps} />
      case 'work-complete': return <WorkComplete {...navProps} params={params} />
      case 'approve-work': return <ApproveWork {...navProps} params={params} />
      case 'qr': return <QRScan {...navProps} />
      case 'profile': return <Profile {...navProps} />
      case 'equipment': return <Equipment {...navProps} />
      case 'equipment-detail': return <EquipmentDetail {...navProps} params={params} />
      case 'earth-care': return <EarthCare {...navProps} />
      case 'admin': return <AdminDashboard {...navProps} />
      case 'tenant-admin': return <TenantAdmin {...navProps} />
      case 'token-transfer': return <TokenTransfer {...navProps} />
      default: return <Home {...navProps} />
    }
  }

  // ランディングページを表示（コミュニティが指定されていない場合）
  if (showLandingPage) {
    return <LandingPage />
  }

  // コミュニティロード中
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-700 font-medium">コミュニティを読み込み中...</p>
        </div>
      </div>
    )
  }

  // Site 2: Community Admin（admin=true でフルページ表示）
  if (isAdminMode && community) {
    return <TenantAdmin goBack={() => { window.location.href = '/' }} />
  }

  // Site 3: モバイルアプリビュー（コミュニティが指定されている場合）
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Phone frame */}
      <div className="w-[390px] h-[844px] bg-[#faf8f4] rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative border-4 border-gray-800">
        {/* Status bar */}
        <div className="flex-shrink-0 h-12 bg-[#faf8f4] flex items-center justify-between px-8 pt-2 z-10">
          <span className="text-xs font-semibold text-gray-700">9:41</span>
          <div className="w-24 h-6 bg-gray-800 rounded-full" />
          <div className="flex gap-1 items-center">
            <span className="text-xs font-semibold text-gray-700">●●●</span>
          </div>
        </div>

        {/* Screen content with transitions */}
        <ScreenTransition screenKey={screen} direction={direction}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#faf8f4' }}>
            {renderScreen()}
          </div>
        </ScreenTransition>

        {/* Bottom nav */}
        {showBottomNav && (
          <div className="z-10">
            <BottomNav activeTab={activeTab} onTabChange={switchTab} />
          </div>
        )}

        {/* Home indicator */}
        <div className="flex-shrink-0 h-8 flex items-center justify-center bg-[#faf8f4] z-10">
          <div className="w-32 h-1 bg-gray-300 rounded-full" />
        </div>
      </div>

      {/* Side hint */}
      <div className="ml-8 text-gray-400 text-sm max-w-xs hidden lg:block">
        <p className="font-semibold text-gray-600 mb-3">
          {community ? `${community.name} (${community.slug})` : 'yui UIプロトタイプ'}
        </p>
        <p className="mb-2">地域コミュニティトークンアプリ</p>
        <p className="text-xs text-gray-400">※ 認証後は実 API に接続されます</p>
      </div>
    </div>
  )
}
