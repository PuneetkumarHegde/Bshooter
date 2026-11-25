/** useAuthStore.js — Authenticated user state (spec §60, §85). */
import { create } from 'zustand';
import * as authService from '../services/authService.js';
import { getToken, setToken } from '../services/apiClient.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: getToken(),
  loading: false,
  error: null,
  ready: false, // becomes true after the initial /me check

  async bootstrap() {
    if (!get().token) {
      set({ ready: true });
      return;
    }
    set({ loading: true });
    try {
      const data = await authService.me();
      set({ user: data.user, loading: false, ready: true });
    } catch {
      setToken(null);
      set({ user: null, token: null, loading: false, ready: true });
    }
  },

  async login(credentials) {
    set({ loading: true, error: null });
    try {
      const data = await authService.login(credentials);
      set({ user: data.user, token: data.token, loading: false });
      return { ok: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  async register(payload) {
    set({ loading: true, error: null });
    try {
      const data = await authService.register(payload);
      set({ user: data.user, token: data.token, loading: false });
      return { ok: true };
    } catch (err) {
      set({ loading: false, error: err.message });
      return { ok: false, error: err.message };
    }
  },

  logout() {
    authService.logout();
    set({ user: null, token: null });
  },

  setUser(user) {
    set({ user });
  },
}));

export default useAuthStore;
