import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GAME_NAME } from '../config/gameConfig.js';
import useAuthStore from '../store/useAuthStore.js';
import audio from '../services/audioEngine.js';
import Character from '../components/Character.jsx';

export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    audio.ensure();
    audio.play('click');
    const res = await register({ name: form.name, email: form.email, password: form.password });
    if (res.ok) navigate('/dashboard', { replace: true });
    else setError(res.error || 'Registration failed');
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12">
      <Character size={90} mood="cheer" />
      <h1 className="mt-2 font-display text-3xl font-extrabold">Join {GAME_NAME}</h1>
      <p className="mb-6 text-white/60">Save your progress and climb the ranks</p>

      <form onSubmit={submit} className="card w-full">
        {error && <div className="mb-3 rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">{error}</div>}
        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-white/60">Name</span>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
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
        <label className="mb-3 block">
          <span className="mb-1 block text-sm text-white/60">Password</span>
          <input
            className="input"
            type="password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-white/60">Confirm password</span>
          <input
            className="input"
            type="password"
            required
            autoComplete="new-password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          />
        </label>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-sm text-white/60">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-300 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
