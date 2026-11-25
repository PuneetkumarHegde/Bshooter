import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { GAME_NAME } from '../config/gameConfig.js';
import useAuthStore from '../store/useAuthStore.js';
import audio from '../services/audioEngine.js';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/levels', label: 'Levels' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/achievements', label: 'Achievements' },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    audio.play('click');
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-night-950/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight">
          <span className="text-2xl">🫧</span>
          <span className="bg-gradient-to-r from-brand-300 to-pink-400 bg-clip-text text-transparent">
            {GAME_NAME}
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to="/dashboard" className="chip">
                👤 {user.name}
              </Link>
              <Link to="/settings" className="btn-ghost px-3 py-2 text-sm">
                Settings
              </Link>
              <button className="btn-ghost px-3 py-2 text-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost px-4 py-2 text-sm">
                Login
              </Link>
              <Link to="/register" className="btn-primary px-4 py-2 text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="btn-ghost p-2 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="text-xl">{open ? '✕' : '☰'}</span>
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 font-semibold ${isActive ? 'bg-white/10' : 'text-white/70'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="mt-2 flex gap-2">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="btn-ghost flex-1 text-sm">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="btn-ghost flex-1 text-sm">
                    Login
                  </Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn-primary flex-1 text-sm">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
