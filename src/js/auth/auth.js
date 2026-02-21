import { authState } from '../state.js';

export async function getCurrentUser() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    authState.currentUser = data.user;
    return data.user;
  } catch {
    return null;
  }
}

export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  authState.currentUser = data.user;
  authState.isGuest = false;
  return data.user;
}

export async function register(name, email, password) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  authState.currentUser = data.user;
  authState.isGuest = false;
  return data.user;
}

export async function loginWithGoogle(code) {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  authState.currentUser = data.user;
  authState.isGuest = false;
  return data.user;
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch { /* ignore */ }
  authState.currentUser = null;
  authState.isGuest = false;
  authState.recordsCache = null;
}

export function enterAsGuest() {
  authState.currentUser = null;
  authState.isGuest = true;
  authState.recordsCache = null;
}

export async function getGoogleClientId() {
  if (window.__GOOGLE_CLIENT_ID) return window.__GOOGLE_CLIENT_ID;
  try {
    const res = await fetch('/api/auth/config', { credentials: 'include' });
    const data = await res.json();
    window.__GOOGLE_CLIENT_ID = data.googleClientId || '';
    return window.__GOOGLE_CLIENT_ID;
  } catch {
    return '';
  }
}

export function isGuest() {
  return authState.isGuest;
}

export async function fetchRecords() {
  if (authState.isGuest || !authState.currentUser) return {};
  if (authState.recordsCache) return authState.recordsCache;

  try {
    const res = await fetch('/api/records', { credentials: 'include' });
    if (!res.ok) return {};
    const data = await res.json();
    authState.recordsCache = data.records;
    return data.records;
  } catch {
    return {};
  }
}

export async function saveGameRecord(gameMode, score, total, timeSeconds) {
  if (authState.isGuest || !authState.currentUser) return;

  try {
    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        game_mode: gameMode,
        score,
        total,
        time_seconds: timeSeconds,
      }),
    });
    authState.recordsCache = null;
  } catch { /* ignore */ }
}
