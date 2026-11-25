import { Link } from 'react-router-dom';
import { GAME_NAME } from '../config/gameConfig.js';
import useAuthStore from '../store/useAuthStore.js';
import Character from '../components/Character.jsx';

const steps = [
  { icon: '🎯', title: 'Aim', text: 'Point the launcher wherever you want.' },
  { icon: '🫧', title: 'Match', text: 'Line up 3+ bubbles of one color.' },
  { icon: '💥', title: 'Pop', text: 'Clear groups and trigger chain drops.' },
  { icon: '🎉', title: 'Rescue', text: 'Free the hidden friends behind the wall.' },
];

export default function Landing() {
  const user = useAuthStore((s) => s.user);
  const playTo = user ? '/levels' : '/register';

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-brand-500 blur-3xl" />
          <div className="absolute right-10 top-32 h-48 w-48 rounded-full bg-pink-500 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-emerald-500 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center md:py-24">
          <Character size={140} mood="happy" />
          <h1 className="mt-4 font-display text-5xl font-extrabold leading-tight md:text-7xl">
            <span className="bg-gradient-to-r from-brand-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">
              {GAME_NAME}
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-lg text-white/70">
            Aim. Match. Pop. Rescue. A colorful bubble shooter with 40+ handcrafted levels, boosters,
            combos, and a global leaderboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to={playTo} className="btn-primary text-lg">
              ▶ Play Now
            </Link>
            <Link to="/leaderboard" className="btn-ghost text-lg">
              🏆 Leaderboard
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.title} className="card text-center">
              <div className="text-4xl">{s.icon}</div>
              <h3 className="mt-2 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-white/60">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="card flex flex-col items-center gap-4 bg-gradient-to-br from-brand-700/40 to-pink-700/20 text-center">
          <h2 className="font-display text-3xl font-extrabold">Ready to pop?</h2>
          <p className="max-w-lg text-white/70">
            Create a free account to save your stars, climb the leaderboard, and continue your progress
            on any device.
          </p>
          <Link to={playTo} className="btn-primary text-lg">
            Start Playing {GAME_NAME}
          </Link>
        </div>
      </section>
    </div>
  );
}
