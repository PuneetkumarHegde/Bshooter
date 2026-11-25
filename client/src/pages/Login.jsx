import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GAME_NAME } from '../config/gameConfig.js';
import useAuthStore from '../store/useAuthStore.js';
import audio from '../services/audioEngine.js';
import Character from '../components/Character.jsx';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    audio.ensure();
    audio.play('click');
    const res = await login(form);
    if (res.ok) {
      const to = location.state?.from || '/dashboard';
      navigate(to, { replace: true });
    } else {
      setError(res.error || 'Login failed');
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12">
      <Character size={90} />
      <h1 className="mt-2 font-display text-3xl font-extrabold">Welcome back</h1>
      <p className="mb-6 text-white/60">Log in to keep playing {GAME_NAME}</p>

      <form onSubmit={submit} className="card w-full">
        {error && <div className="mb-3 rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">{error}</div>}
        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-white/60">Email</span>
          <input
            className="input"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-white/60">Password</span>
          <input
            className="input"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-4 text-sm text-white/60">
        New here?{' '}
        <Link to="/register" className="font-semibold text-brand-300 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
