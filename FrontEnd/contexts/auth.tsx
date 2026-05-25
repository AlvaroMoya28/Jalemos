// Authentication context — wraps the Jalemos REST API.
// Stores the JWT token in expo-secure-store so the session survives app restarts.
// Run `npx expo install expo-secure-store` if it isn't installed yet.

import { ApiError, post } from "@/services/api";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const TOKEN_KEY = "jalemos_token";

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "passenger" | "passenger+driver";
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
  login: (
    identifier: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  register: (
    data: RegisterData,
  ) => Promise<{ success: boolean; error?: string }>;
  upgradeToDriver: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  register: async () => ({ success: false }),
  upgradeToDriver: () => {},
});

function mapResponse(r: AuthResponse): User {
  return {
    id: r.id,
    username: r.username,
    email: r.email,
    firstName: r.firstName,
    lastName: r.lastName,
    role: r.role as User["role"],
    avatar: r.avatar,
    rating: r.rating,
    tripsCount: r.tripsCount,
    memberSince: r.memberSince,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on startup
  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((stored) => {
        if (stored) {
          // Token exists but we don't re-fetch the profile yet — just mark as loaded.
          // A full implementation would call GET /api/auth/me here.
          setToken(stored);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await post<AuthResponse>("/api/auth/login", {
        identifier,
        password,
      });
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      const u = mapResponse(res);
      setToken(res.token);
      setUser(u);
      return { success: true, user: u };
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Error de conexión con el servidor";
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await post<AuthResponse>("/api/auth/register", {
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      });
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      const u = mapResponse(res);
      setToken(res.token);
      setUser(u);
      return { success: true };
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Error de conexión con el servidor";
      return { success: false, error: msg };
    }
  };

  // Called after the admin approves the driver application — updates local state only.
  // The real role change happens via the admin panel (backend sets role='driver').
  const upgradeToDriver = () => {
    setUser((prev) => {
      if (!prev || prev.role !== "passenger") return prev;
      return { ...prev, role: "passenger+driver" };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        register,
        upgradeToDriver,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
