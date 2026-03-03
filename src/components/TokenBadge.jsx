export default function TokenBadge({ amount, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'text-4xl font-black' : size === 'sm' ? 'text-sm font-bold' : 'text-xl font-bold'
  const labelSize = size === 'lg' ? 'text-base' : 'text-xs'

  return (
    <span className="inline-flex items-baseline gap-1">
      <span className={`${sizeClass} text-token-600`}>{amount}</span>
      <span className={`${labelSize} font-semibold text-token-500`}>TOKEN</span>
    </span>
  )
}
