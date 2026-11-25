import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import useAuthStore from './store/useAuthStore.js';
import useProgressStore from './store/useProgressStore.js';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LevelSelect from './pages/LevelSelect.jsx';
import Game from './pages/Game.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Achievements from './pages/Achievements.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import Help from './pages/Help.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const user = useAuthStore((s) => s.user);
  const syncFromServer = useProgressStore((s) => s.syncFromServer);

  // Check for an existing session on load.
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // When a user becomes available, merge their server progress.
  useEffect(() => {
    if (user) syncFromServer();
  }, [user, syncFromServer]);

  return (
    <Routes>
      {/* The game screen is full-bleed, outside the chrome layout. */}
      <Route
        path="/game/:levelId"
        element={
          <ProtectedRoute>
            <Game />
          </ProtectedRoute>
        }
      />

      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/help" element={<Help />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/levels"
          element={
            <ProtectedRoute>
              <LevelSelect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
