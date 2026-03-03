import { Home, ClipboardList, QrCode, Tractor, User } from 'lucide-react'

const tabs = [
  { id: 'home', label: 'ホーム', icon: Home },
  { id: 'tasks', label: '掲示板', icon: ClipboardList },
  { id: 'qr', label: 'QR', icon: QrCode },
  { id: 'equipment', label: '農機具', icon: Tractor },
  { id: 'profile', label: 'マイページ', icon: User },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-200 px-2 pt-2 pb-1">
      <div className="flex justify-around">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors"
            >
              {id === 'qr' ? (
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center -mt-6 shadow-lg transition-colors ${active ? 'bg-primary-500' : 'bg-primary-400'}`}>
                  <Icon size={24} className="text-white" />
                </div>
              ) : (
                <Icon size={22} className={active ? 'text-primary-500' : 'text-gray-400'} />
              )}
              {id !== 'qr' && (
                <span className={`text-[10px] font-medium ${active ? 'text-primary-500' : 'text-gray-400'}`}>
                  {label}
                </span>
              )}
              {id === 'qr' && <span className="text-[10px] font-medium text-primary-500 mt-0.5">QR</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
