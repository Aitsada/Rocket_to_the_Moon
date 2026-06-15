import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('rtm_token');
    if (!token) {
      setLoadingUser(false);
      return;
    }

    authApi.me()
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('rtm_token');
        setUser(null);
      })
      .finally(() => setLoadingUser(false));
  }, []);

  async function login(payload) {
    const data = await authApi.login(payload);
    localStorage.setItem('rtm_token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await authApi.register(payload);
    localStorage.setItem('rtm_token', data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('rtm_token');
    setUser(null);
  }

  const value = useMemo(() => ({
    user,
    setUser,
    loadingUser,
    login,
    register,
    logout
  }), [user, loadingUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
