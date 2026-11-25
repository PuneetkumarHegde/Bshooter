/** authService.js — Authentication API calls (spec §60, §91). */
import api, { setToken } from './apiClient.js';

export async function register({ name, email, password }) {
  const data = await api('/auth/register', { method: 'POST', body: { name, email, password } });
  if (data?.token) setToken(data.token);
  return data;
}

export async function login({ email, password }) {
  const data = await api('/auth/login', { method: 'POST', body: { email, password } });
  if (data?.token) setToken(data.token);
  return data;
}

export async function me() {
  return api('/auth/me', { auth: true });
}

export function logout() {
  setToken(null);
  // Fire-and-forget; logout is also valid purely client-side.
  api('/auth/logout', { method: 'POST', auth: true }).catch(() => {});
}
