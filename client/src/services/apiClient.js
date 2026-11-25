/**
 * apiClient.js — Thin fetch wrapper around the backend API.
 *
 * - Prefixes every request with VITE_API_URL (centralized config).
 * - Attaches the JWT from localStorage to protected requests.
 * - Normalizes errors into a thrown Error with a readable message
 *   (never leaks server stack traces to the UI — spec §82).
 */

import { API_URL } from '../config/gameConfig.js';

const TOKEN_KEY = 'bshooter.token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore storage errors (private mode) */
  }
}

export async function api(path, { method = 'GET', body, auth = false, signal } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    const err = new Error('Network error — check your connection and try again.');
    err.offline = true;
    throw err;
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export default api;
