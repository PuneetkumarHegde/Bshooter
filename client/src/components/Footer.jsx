import { Link } from 'react-router-dom';
import { GAME_NAME } from '../config/gameConfig.js';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-night-950/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-white/50 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {GAME_NAME}. An original bubble shooter.
        </p>
        <div className="flex gap-4">
          <Link to="/help" className="hover:text-white">
            Help
          </Link>
          <Link to="/leaderboard" className="hover:text-white">
            Leaderboard
          </Link>
          <Link to="/achievements" className="hover:text-white">
            Achievements
          </Link>
        </div>
      </div>
    </footer>
  );
}
