export default function ErrorMessage({ message = '読み込みに失敗しました', onRetry }) {
  return (
    <div className="text-center py-8 px-4">
      <p className="text-3xl mb-2">😓</p>
      <p className="text-sm text-red-500 font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-bold active:bg-primary-600"
        >
          再読み込み
        </button>
      )}
    </div>
  )
}
