// Mock authentication context.
// Holds the currently logged-in user and exposes login / logout / register actions.
// Users are stored in a module-level array that starts with SEED_USERS — new registrations
// are appended for the session (no persistence yet; replace with real API calls later).

import { createContext, ReactNode, useContext, useState } from 'react';
import { MockUser, SEED_USERS } from '@/constants/mock-users';

// Module-level mutable store so registrations survive re-renders within the session
const userStore: MockUser[] = [...SEED_USERS];

export interface RegisterData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface AuthContextType {
  user: MockUser | null;
  login: (username: string, password: string) => { success: boolean; error?: string; user?: MockUser };
  logout: () => void;
  register: (data: RegisterData) => { success: boolean; error?: string };
  /** Upgrades the current passenger to 'passenger+driver' after completing driver registration. */
  upgradeToDriver: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => ({ success: false }),
  logout: () => {},
  register: () => ({ success: false }),
  upgradeToDriver: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);

  const login = (username: string, password: string): { success: boolean; error?: string; user?: MockUser } => {
    const trimmed = username.trim().toLowerCase();
    const found = userStore.find(
      (u) => (u.username.toLowerCase() === trimmed || u.email.toLowerCase() === trimmed)
        && u.password === password
    );
    if (!found) return { success: false, error: 'Usuario o contraseña incorrectos' };
    setUser(found);
    return { success: true, user: found };
  };

  const logout = () => setUser(null);

  const upgradeToDriver = () => {
    setUser((prev) => {
      if (!prev || prev.role === 'passenger+driver' || prev.role === 'admin') return prev;
      const updated = { ...prev, role: 'passenger+driver' as const };
      const idx = userStore.findIndex((u) => u.id === prev.id);
      if (idx !== -1) userStore[idx] = updated;
      return updated;
    });
  };

  const register = (data: RegisterData): { success: boolean; error?: string } => {
    const trimmedUser = data.username.trim().toLowerCase();
    const trimmedEmail = data.email.trim().toLowerCase();

    if (userStore.some((u) => u.username.toLowerCase() === trimmedUser)) {
      return { success: false, error: 'Ese nombre de usuario ya está en uso' };
    }
    if (userStore.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      return { success: false, error: 'Ya existe una cuenta con ese correo' };
    }

    const newUser: MockUser = {
      id: `user-${Date.now()}`,
      username: data.username.trim(),
      email: data.email.trim().toLowerCase(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      password: data.password,
      role: 'passenger',
      avatar: `${data.firstName.trim()[0] ?? '?'}${data.lastName.trim()[0] ?? '?'}`.toUpperCase(),
      rating: 5.0,
      tripsCount: 0,
      memberSince: new Date().toLocaleDateString('es-CR', { month: 'long', year: 'numeric' }),
    };

    userStore.push(newUser);
    setUser(newUser);
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, upgradeToDriver }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
