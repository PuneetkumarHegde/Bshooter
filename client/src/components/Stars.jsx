/** Stars.jsx — 3-star rating display (spec §34). */
export default function Stars({ value = 0, size = 'md', className = '' }) {
  const px = size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-base' : 'text-2xl';
  return (
    <div className={`flex items-center gap-1 ${px} ${className}`} aria-label={`${value} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= value ? 'text-yellow-300 drop-shadow' : 'text-white/15'}>
          ★
        </span>
      ))}
    </div>
  );
}
