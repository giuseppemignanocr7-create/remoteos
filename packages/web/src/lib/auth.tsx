import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth as authApi } from './api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  devLogin: () => void;
}

const AuthContext = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const devMode = localStorage.getItem('dev_mode');
    if (devMode) {
      setUser({ id: 'dev-000', email: 'dev@remoteos.local', full_name: 'Dev User', role: 'admin' });
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('access_token');
    if (token) {
      authApi.me().then(setUser).catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const devLogin = () => {
    localStorage.setItem('dev_mode', '1');
    setUser({ id: 'dev-000', email: 'dev@remoteos.local', full_name: 'Dev User', role: 'admin' });
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem('access_token', res.access_token);
    localStorage.setItem('refresh_token', res.refresh_token);
    const me = await authApi.me();
    setUser(me);
  };

  const register = async (email: string, password: string, fullName: string) => {
    await authApi.register(email, password, fullName);
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('dev_mode');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, devLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
