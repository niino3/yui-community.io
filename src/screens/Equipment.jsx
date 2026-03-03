import Header from '../components/Header'
import { equipment } from '../data/mockData'

export default function Equipment({ navigate }) {
  return (
    <div className="screen">
      <Header title="共有農機具" />

      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="bg-gradient-to-b from-amber-50 to-[#faf8f4] px-5 pt-3 pb-4">
          <p className="text-xs text-gray-500">TOKENを使って農機具を借りられます</p>
        </div>

        <div className="px-4 pb-6 space-y-3">
          {equipment.map(item => (
            <button
              key={item.id}
              onClick={() => navigate('equipment-detail', { equipmentId: item.id })}
              className="card w-full p-4 text-left active:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${item.available ? 'bg-amber-50' : 'bg-gray-100'}`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-800">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.brand}</p>
                    </div>
                    <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${item.available ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                      {item.available ? '空き有り' : '貸出中'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-lg font-black text-token-600">{item.pricePerHalf}</span>
                      <span className="text-xs text-token-500">TOKEN/半日</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <span className="text-xs text-gray-500">⭐ {item.rating}</span>
                    <span className="text-xs text-gray-400">{item.useCount}回利用</span>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    {item.available ? (
                      <span className="text-green-600 font-medium">● {item.nextAvailable}</span>
                    ) : (
                      <span className="text-red-500">次の空き: {item.nextAvailable}</span>
                    )}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Note */}
        <div className="mx-4 mb-6 bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <p className="text-xs text-amber-700 font-bold mb-1">🚜 農機具シェアについて</p>
          <p className="text-xs text-amber-600 leading-relaxed">
            コミュニティの共有財産です。利用後は清掃・確認をお願いします。
            トラブル時はコミュニティ運営者（さやかさん）へご連絡ください。
          </p>
        </div>
      </div>
    </div>
  )
}
