import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  roles: Array<{ id: number; name: string; description?: string }>;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<User | null>;
  instituteLogin: (usernameOrEmail: string, password: string, rememberMe?: boolean) => Promise<User | null>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
      localStorage.removeItem('kite_token');
      localStorage.removeItem('kite_refresh_token');
      sessionStorage.removeItem('kite_token');
      sessionStorage.removeItem('kite_refresh_token');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('kite_token') || sessionStorage.getItem('kite_token');
    if (token) {
      // Set default header for api
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', {
        username_or_email: usernameOrEmail,
        password,
      });
      const { access_token, refresh_token } = response.data;
      localStorage.setItem('kite_token', access_token);
      localStorage.setItem('kite_refresh_token', refresh_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      const profileRes = await api.get('/auth/me');
      setUser(profileRes.data);
      return profileRes.data;
    } finally {
      setIsLoading(false);
    }
  };

  const instituteLogin = async (usernameOrEmail: string, password: string, rememberMe: boolean = false): Promise<User | null> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/institute/login', {
        username_or_email: usernameOrEmail,
        password,
      });
      const { access_token, refresh_token } = response.data;
      if (rememberMe) {
        localStorage.setItem('kite_token', access_token);
        localStorage.setItem('kite_refresh_token', refresh_token);
      } else {
        sessionStorage.setItem('kite_token', access_token);
        sessionStorage.setItem('kite_refresh_token', refresh_token);
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      const profileRes = await api.get('/auth/me');
      setUser(profileRes.data);
      return profileRes.data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const refreshToken = localStorage.getItem('kite_refresh_token') || sessionStorage.getItem('kite_refresh_token');
      await api.post('/auth/logout', { refresh_token: refreshToken || '' });
    } catch (err) {
      console.error("Logout request error", err);
    } finally {
      setUser(null);
      localStorage.removeItem('kite_token');
      localStorage.removeItem('kite_refresh_token');
      sessionStorage.removeItem('kite_token');
      sessionStorage.removeItem('kite_refresh_token');
      delete api.defaults.headers.common['Authorization'];
      setIsLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // Admins bypass permission checks
    if (user.roles.some((r) => r.name.toLowerCase() === 'admin')) return true;
    return user.permissions.includes(permission.toLowerCase());
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    return user.roles.some((r) => r.name.toLowerCase() === roleName.toLowerCase());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        instituteLogin,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
