import { useState } from 'react'
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCreateCommunity, useUpdateCommunity } from '../hooks/usePlatform'

const STEPS = ['基本情報', 'トークン設定', 'デザイン', '確認']

const DEFAULT_COLORS = [
  { label: '緑（農業）', primary: '#3d7a55', secondary: '#6b9080' },
  { label: '青（海・水産）', primary: '#2563eb', secondary: '#60a5fa' },
  { label: '茶（林業）', primary: '#92400e', secondary: '#b45309' },
  { label: '紫（文化）', primary: '#7c3aed', secondary: '#a78bfa' },
  { label: '赤（祭り）', primary: '#dc2626', secondary: '#f87171' },
]

export default function CreateCommunity({ onBack, onCreated, editData }) {
  const isEdit = !!editData
  const [step, setStep] = useState(0)
  const [created, setCreated] = useState(false)
  const [form, setForm] = useState({
    name: editData?.name || '',
    slug: editData?.slug || '',
    description: editData?.description || '',
    token_name: editData?.token_name || '',
    token_symbol: editData?.token_symbol || '',
    initial_supply: editData?.initial_supply || 10000,
    token_rate_description: editData?.token_rate_description || '',
    color_primary: editData?.color_primary || '#3d7a55',
    color_secondary: editData?.color_secondary || '#6b9080',
    max_members: editData?.max_members || 100,
  })

  const createMutation = useCreateCommunity()
  const updateMutation = useUpdateCommunity()
  const saveMutation = isEdit ? updateMutation : createMutation

  function update(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function autoSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30)
  }

  async function handleSubmit() {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: editData.id, data: form })
      } else {
        await createMutation.mutateAsync(form)
      }
      setCreated(true)
      onCreated?.()
    } catch {
      /* error shown via mutation state */
    }
  }

  const canProceed = () => {
    switch (step) {
      case 0: return form.name && form.slug
      case 1: return form.token_name && form.token_symbol && form.initial_supply > 0
      case 2: return form.color_primary
      case 3: return true
      default: return false
    }
  }

  if (created) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">{isEdit ? 'コミュニティを更新しました！' : 'コミュニティを作成しました！'}</h2>
          <p className="text-gray-500 mb-6">{form.name} {isEdit ? 'の設定を保存しました' : 'が利用可能になりました'}</p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">コミュニティ名</span>
              <span className="font-bold">{form.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">スラグ</span>
              <span className="font-mono text-primary-600">@{form.slug}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">トークン</span>
              <span className="font-bold">{form.token_name} ({form.token_symbol})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">初期供給量</span>
              <span className="font-bold">{form.initial_supply.toLocaleString()}</span>
            </div>
          </div>
          <button onClick={onBack} className="w-full py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors">
            コミュニティ一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-gray-600 hover:text-gray-800">
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">戻る</span>
          </button>
          <h1 className="text-lg font-bold text-gray-800">{isEdit ? 'コミュニティを編集' : 'コミュニティを作成'}</h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-6 pt-6">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < step ? 'bg-primary-500 text-white' : i === step ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-[10px] text-gray-500 mt-1">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 h-0.5 mx-1 ${i < step ? 'bg-primary-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 pb-32">
        {step === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="text-xl font-bold text-gray-800">基本情報</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">コミュニティ名 *</label>
              <input
                value={form.name}
                onChange={e => { update('name', e.target.value); if (!form.slug) update('slug', autoSlug(e.target.value)) }}
                placeholder="例: 北海道パーマカルチャー農園"
                className="w-full py-3 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">スラグ（URL用） *</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">@</span>
                <input
                  value={form.slug}
                  onChange={e => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="hokkaido-farm"
                  className="flex-1 py-3 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-primary-400"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{form.slug}.yui-community.io でアクセスできます</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">説明（任意）</label>
              <textarea
                value={form.description}
                onChange={e => update('description', e.target.value)}
                placeholder="コミュニティの概要を入力..."
                rows={3}
                className="w-full py-3 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary-400 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最大メンバー数</label>
              <input
                type="number"
                value={form.max_members}
                onChange={e => update('max_members', Number(e.target.value))}
                className="w-full py-3 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="text-xl font-bold text-gray-800">トークン設定</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">トークン名 *</label>
              <input
                value={form.token_name}
                onChange={e => update('token_name', e.target.value)}
                placeholder="例: Hokkaido Community Dollar"
                className="w-full py-3 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">トークンシンボル *</label>
              <input
                value={form.token_symbol}
                onChange={e => update('token_symbol', e.target.value.toUpperCase().slice(0, 6))}
                placeholder="例: HKD"
                className="w-full py-3 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">初期発行量</label>
              <input
                type="number"
                value={form.initial_supply}
                onChange={e => update('initial_supply', Number(e.target.value))}
                className="w-full py-3 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
              />
              <p className="text-xs text-gray-400 mt-1">管理者ウォレットに発行されます</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">トークン価値の説明（任意）</label>
              <input
                value={form.token_rate_description}
                onChange={e => update('token_rate_description', e.target.value)}
                placeholder="例: 1 HKD = 草取り1時間分"
                className="w-full py-3 px-4 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="text-xl font-bold text-gray-800">デザイン</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">テーマカラー</label>
              <div className="grid grid-cols-2 gap-3">
                {DEFAULT_COLORS.map(c => (
                  <button
                    key={c.label}
                    onClick={() => { update('color_primary', c.primary); update('color_secondary', c.secondary) }}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${
                      form.color_primary === c.primary ? 'border-gray-800' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full" style={{ background: c.primary }} />
                      <div className="w-6 h-6 rounded-full" style={{ background: c.secondary }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">カスタムカラー</label>
              <div className="flex gap-4">
                <div>
                  <span className="text-xs text-gray-500">メイン</span>
                  <input
                    type="color"
                    value={form.color_primary}
                    onChange={e => update('color_primary', e.target.value)}
                    className="block w-12 h-12 rounded-lg cursor-pointer border border-gray-200"
                  />
                </div>
                <div>
                  <span className="text-xs text-gray-500">サブ</span>
                  <input
                    type="color"
                    value={form.color_secondary}
                    onChange={e => update('color_secondary', e.target.value)}
                    className="block w-12 h-12 rounded-lg cursor-pointer border border-gray-200"
                  />
                </div>
              </div>
            </div>
            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">プレビュー</label>
              <div className="rounded-2xl overflow-hidden border border-gray-200">
                <div className="h-20" style={{ background: `linear-gradient(135deg, ${form.color_primary}, ${form.color_secondary})` }} />
                <div className="p-4">
                  <h3 className="font-bold text-gray-800">{form.name || 'コミュニティ名'}</h3>
                  <p className="text-sm text-gray-500">{form.token_symbol || 'TOKEN'} | @{form.slug || 'slug'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">確認</h2>
            <div className="space-y-3">
              {[
                ['コミュニティ名', form.name],
                ['スラグ', `@${form.slug}`],
                ['説明', form.description || '（なし）'],
                ['トークン名', `${form.token_name} (${form.token_symbol})`],
                ['初期発行量', form.initial_supply.toLocaleString()],
                ['最大メンバー数', form.max_members],
                ['トークン価値', form.token_rate_description || '（なし）'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800">{value}</span>
                </div>
              ))}
              <div className="flex items-center gap-3 py-2">
                <span className="text-sm text-gray-500">テーマカラー</span>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full" style={{ background: form.color_primary }} />
                  <div className="w-8 h-8 rounded-full" style={{ background: form.color_secondary }} />
                </div>
              </div>
            </div>
            {saveMutation.isError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                <p className="font-bold mb-1">{isEdit ? '更新に失敗しました' : '作成に失敗しました'}</p>
                <p>{saveMutation.error?.body?.message || saveMutation.error?.message}</p>
                {(saveMutation.error?.status === 401 || saveMutation.error?.status === 404) && (
                  <p className="mt-2 text-xs text-red-500">
                    バックエンドの platform API ルートが未デプロイの可能性があります。
                    Railway にデプロイ後に再試行してください。
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
            >
              <ChevronLeft size={18} /> 戻る
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className={`flex-1 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors flex items-center justify-center gap-1 ${!canProceed() ? 'opacity-50' : ''}`}
            >
              次へ <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-colors"
            >
              {saveMutation.isPending ? (isEdit ? '更新中...' : '作成中...') : (isEdit ? 'コミュニティを更新する' : 'コミュニティを作成する')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
