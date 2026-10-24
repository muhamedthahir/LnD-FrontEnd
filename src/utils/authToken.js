export function readStoredAccessToken() {
  const value = localStorage.getItem('accessToken');
  if (!value || value === 'null' || value === 'undefined') return null;
  return value;
}

export function readStoredRefreshToken() {
  const value = localStorage.getItem('refreshToken');
  if (!value || value === 'null' || value === 'undefined') return null;
  return value;
}

export function tokenExpiryMs(token) {
  try {
    const part = String(token).split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isAccessTokenUsable(token, skewMs = 5 * 60 * 1000) {
  const expiresAt = tokenExpiryMs(token);
  if (!expiresAt) return false;
  return expiresAt - Date.now() > skewMs;
}
