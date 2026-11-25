/** Toast.jsx — Tiny transient message. */
import { useEffect } from 'react';

export default function Toast({ message, onDone, duration = 1600 }) {
  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => onDone?.(), duration);
    return () => clearTimeout(t);
  }, [message, duration, onDone]);

  if (!message) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-20 z-40 -translate-x-1/2 animate-pop-in rounded-full bg-night-950/90 px-4 py-2 text-sm font-semibold text-white shadow-lg">
      {message}
    </div>
  );
}
