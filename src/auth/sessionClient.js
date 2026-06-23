/** Cross-tab auth sync (BroadcastChannel is reliable when both tabs are open; storage events only fire in *other* tabs). */
export const AUTH_SYNC_CHANNEL = 'lnd-auth-sync-v1'

export function hasPersistedSession() {
  try {
    return !!(
      localStorage.getItem('accessToken') ||
      localStorage.getItem('refreshToken')
    )
  } catch {
    return false
  }
}

export function broadcastAuthSync() {
  try {
    const bc = new BroadcastChannel(AUTH_SYNC_CHANNEL)
    bc.postMessage({ type: 'auth-changed' })
    bc.close()
  } catch {
    // Unsupported or blocked
  }
}
