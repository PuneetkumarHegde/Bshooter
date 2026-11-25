/** Loading.jsx — Spinner + skeleton loading states (spec §81). */
export default function Loading({ label = 'Loading…', full = false }) {
  return (
    <div className={`flex ${full ? 'min-h-screen' : 'py-16'} flex-col items-center justify-center gap-4`}>
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-white/10 border-t-brand-400" />
        <span className="absolute inset-0 flex items-center justify-center text-xl">🫧</span>
      </div>
      <p className="font-display text-white/70">{label}</p>
    </div>
  );
}

export function SkeletonRow() {
  return <div className="skeleton h-12 w-full rounded-xl" />;
}
