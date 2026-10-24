import { createViewStyles } from "../../viewStyles";
const styles = createViewStyles("SecureLayout");
import { Outlet } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useApi } from "../../../contexts/ApiContext";
import { API_ENDPOINTS } from "../../../constants/constants";
import { isAccessTokenUsable, readStoredAccessToken, readStoredRefreshToken } from "../../../utils/authToken";
function SecureLayout() {
  const {
    apiBaseUrl,
    ensureAccessToken,
    isLoading: apiLoading
  } = useApi();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionReadyRef = useRef(false);
  const checkAuth = useCallback(async () => {
    if (sessionReadyRef.current) {
      return;
    }
    if (apiLoading || !apiBaseUrl) {
      return;
    }
    const acceptUser = dataUser => {
      setUser(dataUser);
      localStorage.setItem('user', JSON.stringify(dataUser));
      sessionReadyRef.current = true;
      setLoading(false);
    };
    try {
      const keepCachedSession = () => {
        const cached = localStorage.getItem('user');
        if (!cached || !readStoredRefreshToken()) return false;
        try {
          acceptUser(JSON.parse(cached));
          return true;
        } catch (e) {
          return false;
        }
      };
      let token = await ensureAccessToken();
      if (!token) {
        if (!keepCachedSession()) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      let response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.CHECK}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          acceptUser(data.user);
          return;
        }
      }
      token = await ensureAccessToken({ force: true });
      if (token && isAccessTokenUsable(token, 0)) {
        response = await fetch(`${apiBaseUrl}${API_ENDPOINTS.AUTH.CHECK}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            acceptUser(data.user);
            return;
          }
        }
      }
      if (keepCachedSession()) return;
      const cached = localStorage.getItem('user');
      const stored = readStoredAccessToken();
      if (cached && stored && isAccessTokenUsable(stored, 0)) {
        acceptUser(JSON.parse(cached));
        return;
      }
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      const cached = localStorage.getItem('user');
      if (cached && (readStoredAccessToken() || readStoredRefreshToken())) {
        try {
          acceptUser(JSON.parse(cached));
          return;
        } catch (e) {}
      }
      setUser(null);
      setLoading(false);
    }
  }, [apiBaseUrl, ensureAccessToken, apiLoading]);
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  if (loading) {
    return <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading secure assessment...</p>
      </div>;
  }
  if (!user) {
    return <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Session Expired</h2>
          <p>Your session has expired. Please close this window and start the assessment again from the main window.</p>
        </div>
      </div>;
  }
  return <div className={styles.secureLayout}>
      <main className={styles.main}>
        <Outlet context={{
        user
      }} />
      </main>
    </div>;
}
export default SecureLayout;
