/**
 * Character.jsx — "Bubbo", the game's ORIGINAL helper character (spec §54).
 *
 * A friendly round bubble-sprite drawn entirely as inline SVG. It is original
 * artwork — NOT copied from any reference game's characters.
 */
export default function Character({ size = 120, mood = 'happy', className = '' }) {
  const eyeY = mood === 'sad' ? 44 : 42;
  const mouth =
    mood === 'happy'
      ? 'M40 62 Q60 80 80 62'
      : mood === 'cheer'
        ? 'M42 60 Q60 86 78 60 Z'
        : mood === 'sad'
          ? 'M42 70 Q60 56 78 70'
          : 'M44 64 Q60 72 76 64';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`animate-float ${className}`}
      role="img"
      aria-label="Bubbo, your bubble buddy"
    >
      <defs>
        <radialGradient id="bubboBody" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#cfe0ff" />
          <stop offset="55%" stopColor="#6aa8ff" />
          <stop offset="100%" stopColor="#3f6fd6" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="46" fill="url(#bubboBody)" />
      <circle cx="44" cy="40" r="10" fill="#fff" opacity="0.8" />
      {/* eyes */}
      <circle cx="48" cy={eyeY} r="7" fill="#1a1830" />
      <circle cx="74" cy={eyeY} r="7" fill="#1a1830" />
      <circle cx="50" cy={eyeY - 2} r="2.4" fill="#fff" />
      <circle cx="76" cy={eyeY - 2} r="2.4" fill="#fff" />
      {/* cheeks */}
      <circle cx="38" cy="58" r="5" fill="#ff8fb0" opacity="0.6" />
      <circle cx="84" cy="58" r="5" fill="#ff8fb0" opacity="0.6" />
      {/* mouth */}
      <path d={mouth} fill={mood === 'cheer' ? '#1a1830' : 'none'} stroke="#1a1830" strokeWidth="3" strokeLinecap="round" />
      {/* little antenna bubble */}
      <line x1="60" y1="16" x2="60" y2="6" stroke="#6aa8ff" strokeWidth="3" />
      <circle cx="60" cy="5" r="5" fill="#ffd23f" />
    </svg>
  );
}
