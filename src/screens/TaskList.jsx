import { useState } from 'react'
import { SlidersHorizontal, MapPin } from 'lucide-react'
import Header from '../components/Header'
import TaskCard from '../components/TaskCard'
import { tasks } from '../data/mockData'

const filters = ['すべて', '草取り', '収穫', '種まき', '袋詰め', '未経験OK']

export default function TaskList({ navigate }) {
  const [activeFilter, setActiveFilter] = useState('すべて')
  const [viewMode, setViewMode] = useState('list')

  const filtered = tasks.filter(t => {
    if (activeFilter === 'すべて') return true
    if (activeFilter === '未経験OK') return t.skillLevel === 'beginner'
    return t.type === activeFilter
  })

  return (
    <div className="screen">
      <Header
        title="お手伝い掲示板"
        rightElement={
          <button className="w-10 h-10 flex items-center justify-center">
            <SlidersHorizontal size={20} className="text-gray-600" />
          </button>
        }
      />

      {/* Filter bar */}
      <div className="flex-shrink-0 bg-[#faf8f4] px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                activeFilter === f
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            リスト
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${viewMode === 'map' ? 'bg-primary-500 text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            <MapPin size={12} className="inline mr-1" />地図
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {viewMode === 'map' ? (
          <div className="relative">
            {/* Map placeholder */}
            <div className="h-56 bg-gradient-to-b from-green-100 to-green-200 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, #4a7c59 0, #4a7c59 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #4a7c59 0, #4a7c59 1px, transparent 0, transparent 50%)',
                backgroundSize: '30px 30px'
              }} />
              {/* Map pins */}
              {filtered.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => navigate('task-detail', { taskId: t.id })}
                  className="absolute bg-white rounded-xl shadow-md px-2 py-1 flex items-center gap-1"
                  style={{ top: `${20 + i * 25}%`, left: `${15 + i * 20}%` }}
                >
                  <span className="text-xs font-bold text-token-600">{t.reward}</span>
                  <span className="text-[10px] text-token-500">TOKEN</span>
                </button>
              ))}
              <span className="text-gray-400 text-sm">地図（モック）</span>
            </div>

            {/* Task list below map */}
            <div className="p-4 space-y-3">
              {filtered.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => navigate('task-detail', { taskId: task.id })}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">🌿</p>
                <p className="text-sm">該当するタスクがありません</p>
              </div>
            ) : (
              filtered.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => navigate('task-detail', { taskId: task.id })}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
