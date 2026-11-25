import { Link } from 'react-router-dom';
import { GAME_NAME } from '../config/gameConfig.js';
import Character from '../components/Character.jsx';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <Character size={110} mood="sad" />
      <h1 className="mt-4 font-display text-6xl font-extrabold">404</h1>
      <p className="mt-2 text-white/60">
        That page floated away. Let's get you back to {GAME_NAME}.
      </p>
      <Link to="/" className="btn-primary mt-6">
        Back home
      </Link>
    </div>
  );
}
