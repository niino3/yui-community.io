export default function StarRating({ rating, size = 'sm', interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5]
  const sizeClass = size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-xl' : 'text-sm'

  if (interactive) {
    return (
      <div className="flex gap-1">
        {stars.map(s => (
          <button key={s} onClick={() => onChange?.(s)} className={sizeClass}>
            {s <= rating ? '⭐' : '☆'}
          </button>
        ))}
      </div>
    )
  }

  return (
    <span className={`${sizeClass} text-yellow-400`}>
      {'⭐'.repeat(Math.round(rating))}
      <span className="text-gray-500 text-xs ml-1">{rating.toFixed(1)}</span>
    </span>
  )
}
