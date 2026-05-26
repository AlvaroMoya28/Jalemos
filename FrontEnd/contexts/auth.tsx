// Authentication context — wraps the Jalemos REST API.
// Stores the JWT token in expo-secure-store so the session survives app restarts.
// Run `npx expo install expo-secure-store` if it isn't installed yet.

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { get, post, ApiError } from '@/services/api';

const TOKEN_KEY           = 'jalemos_token';
const DRIVER_ACTIVATED_KEY = 'jalemos_driver_activated';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'passenger' | 'passenger+driver';
  avatar: string;
  rating: number;
  tripsCount: number;
  memberSince: string;
}

interface AuthResponse {
  token: string;
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar: string;
  rating: number;
  tripsCount: number;
  memberSince: string;
}

export interface RegisterData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  driverActivated: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  upgradeToDriver: () => Promise<string>;
  setDriverActivated: (v: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  driverActivated: false,
  login: async () => ({ success: false }),
  logout: async () => {},
  register: async () => ({ success: false }),
  upgradeToDriver: async () => 'passenger',
  setDriverActivated: async () => {},
});

function mapResponse(r: AuthResponse): User {
  return {
    id:          r.id,
    username:    r.username,
    email:       r.email,
    firstName:   r.firstName,
    lastName:    r.lastName,
    role:        r.role as User['role'],
    avatar:      r.avatar,
    rating:      r.rating,
    tripsCount:  r.tripsCount,
    memberSince: r.memberSince,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]               = useState<User | null>(null);
  const [token, setToken]             = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [driverActivated, _setDriverActivated] = useState(false);

  // Restore session on startup — refresh the JWT to get the current user profile and role
  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(DRIVER_ACTIVATED_KEY),
    ]).then(async ([stored, activated]) => {
      if (!stored) return;
      try {
        const res = await get<AuthResponse>('/api/auth/refresh', stored);
        await SecureStore.setItemAsync(TOKEN_KEY, res.token);
        setToken(res.token);
        setUser(mapResponse(res));
        // Sync driverActivated with actual role from server
        if (res.role === 'passenger+driver' && activated === '1') {
          _setDriverActivated(true);
        } else if (res.role !== 'passenger+driver' && activated === '1') {
          // Admin removed driver role — clear the flag
          await SecureStore.deleteItemAsync(DRIVER_ACTIVATED_KEY);
        }
      } catch {
        // Server unavailable — restore flag from SecureStore and keep token
        if (activated === '1') _setDriverActivated(true);
        setToken(stored);
      }
    }).finally(() => setIsLoading(false));
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await post<AuthResponse>('/api/auth/login', { identifier, password });
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      const u = mapResponse(res);
      setToken(res.token);
      setUser(u);
      // Sync driverActivated with SecureStore + actual role
      if (u.role !== 'passenger+driver') {
        await SecureStore.deleteItemAsync(DRIVER_ACTIVATED_KEY);
        _setDriverActivated(false);
      } else {
        const activated = await SecureStore.getItemAsync(DRIVER_ACTIVATED_KEY);
        _setDriverActivated(activated === '1');
      }
      return { success: true, user: u };
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error de conexión con el servidor';
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
    _setDriverActivated(false);
    // driverActivated NOT cleared from SecureStore on logout — it survives sessions
    // so the onboarding pipeline doesn't repeat. It only clears if the admin
    // removes the driver role (handled in login and startup refresh).
  };

  const setDriverActivated = async (v: boolean) => {
    if (v) {
      await SecureStore.setItemAsync(DRIVER_ACTIVATED_KEY, '1');
    } else {
      await SecureStore.deleteItemAsync(DRIVER_ACTIVATED_KEY);
    }
    _setDriverActivated(v);
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await post<AuthResponse>('/api/auth/register', {
        username:  data.username,
        email:     data.email,
        firstName: data.firstName,
        lastName:  data.lastName,
        password:  data.password,
      });
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      const u = mapResponse(res);
      setToken(res.token);
      setUser(u);
      return { success: true };
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Error de conexión con el servidor';
      return { success: false, error: msg };
    }
  };

  // Fetches a fresh JWT from the server (role may have changed to 'driver' after admin approval)
  // then updates local state. Navigates to offer tab on success.
  const upgradeToDriver = async (): Promise<string> => {
    if (!token) return 'passenger';
    try {
      const res = await get<AuthResponse>('/api/auth/refresh', token);
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(mapResponse(res));
      return res.role; // 'passenger+driver' if still approved, 'passenger' if role was removed
    } catch {
      // Offline fallback — assume role unchanged
      setUser((prev) => prev ? { ...prev, role: 'passenger+driver' } : prev);
      return 'passenger+driver';
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, driverActivated, login, logout, register, upgradeToDriver, setDriverActivated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
