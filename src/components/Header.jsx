import { ChevronLeft } from 'lucide-react'

export default function Header({ title, onBack, rightElement, transparent = false }) {
  return (
    <div className={`flex-shrink-0 flex items-center h-14 px-4 gap-2 ${transparent ? '' : 'bg-[#faf8f4] border-b border-gray-100'}`}>
      {onBack && (
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} className="text-gray-700" />
        </button>
      )}
      {!onBack && <div className="w-10" />}
      <h1 className="flex-1 text-center text-base font-bold text-gray-800">{title}</h1>
      <div className="w-10">
        {rightElement}
      </div>
    </div>
  )
}
