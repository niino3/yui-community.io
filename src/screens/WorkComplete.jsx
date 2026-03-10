import { useState } from 'react'
import { Camera, CheckCircle } from 'lucide-react'
import Header from '../components/Header'
import { useAuth } from '../context/AuthContext'
import { useCompleteTask } from '../hooks/useTasks'

const steps = ['写真撮影', 'QRスキャン', '完了']

export default function WorkComplete({ goBack, params }) {
  const [step, setStep] = useState(0)
  const [photoTaken, setPhotoTaken] = useState(false)
  const [qrScanned, setQrScanned] = useState(false)
  const [sent, setSent] = useState(false)

  const { isAuthenticated } = useAuth()
  const completeMutation = useCompleteTask()

  const task = params?.task || {
    title: '田中よし子さんの畑の草取り',
    reward: 30,
    token_reward: 30,
    requester: { name: '田中 よし子', avatar: '👩‍🌾' },
  }

  const reward = task.token_reward ?? task.reward
  const requesterName = task.requester?.display_name ?? task.requester?.name ?? '依頼者'

  function handlePhoto() {
    setPhotoTaken(true)
    setTimeout(() => setStep(1), 800)
  }

  async function handleQR() {
    setQrScanned(true)
    if (isAuthenticated) {
      try {
        await completeMutation.mutateAsync(task.id)
      } catch { /* proceed with mock flow */ }
    }
    setTimeout(() => setSent(true), 800)
  }

  if (sent) {
    return (
      <div className="screen">
        <Header title="完了報告" onBack={goBack} />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={40} className="text-primary-500" />
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">完了報告を送りました！</h2>
          <p className="text-sm text-gray-500">
            {requesterName}さんの承認をお待ちください。
            承認されると <span className="font-bold text-token-600">{reward} TOKEN</span> が届きます。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <Header title="作業完了を報告" onBack={goBack} />

      {/* Step indicator */}
      <div className="flex-shrink-0 px-6 py-3 bg-[#faf8f4]">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-1.5 ${i <= step ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-primary-500 text-white' : i === step ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-xs font-medium text-gray-600">{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${i < step ? 'bg-primary-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Task info */}
        <div className="card p-4 mb-4 flex items-center gap-3">
          <span className="text-3xl">{task.requester?.avatar ?? '👤'}</span>
          <div>
            <p className="text-xs text-gray-500">対象タスク</p>
            <p className="text-sm font-bold text-gray-800">{task.title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-token-600">+{reward}</span>
              <span className="text-xs text-token-500">TOKEN</span>
            </div>
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-gray-700 text-center">作業後の写真を撮影してください</p>

            {photoTaken ? (
              <div className="h-48 bg-gradient-to-b from-green-100 to-green-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl">🌿</span>
                </div>
                <div className="absolute top-3 right-3 bg-primary-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                  ✓ 撮影済み
                </div>
              </div>
            ) : (
              <button
                onClick={handlePhoto}
                className="w-full h-48 bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 active:bg-gray-200 transition-colors"
              >
                <Camera size={40} className="text-gray-400" />
                <p className="text-sm font-bold text-gray-500">タップして撮影</p>
              </button>
            )}

            <p className="text-xs text-gray-400 text-center">作業前後の写真があると承認されやすくなります</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-gray-700 text-center">
              {requesterName}さんのスマホに<br />表示されたQRをスキャンしてください
            </p>

            {qrScanned ? (
              <div className="h-48 bg-primary-50 rounded-2xl flex items-center justify-center border-2 border-primary-300">
                <div className="text-center">
                  <CheckCircle size={40} className="text-primary-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-primary-600">スキャン完了！</p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleQR}
                className="w-full h-48 bg-gray-900 rounded-2xl flex flex-col items-center justify-center gap-3 active:bg-gray-800 transition-colors relative overflow-hidden"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border-2 border-white rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-400 rounded-tl-md" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-400 rounded-tr-md" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-400 rounded-bl-md" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-400 rounded-br-md" />
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-primary-400 animate-pulse" />
                  </div>
                </div>
                <p className="text-white text-sm font-bold mt-28">タップでQRスキャン（モック）</p>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
