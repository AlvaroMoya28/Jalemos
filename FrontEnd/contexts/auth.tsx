// Authentication context — wraps the Jalemos REST API.
// Stores the JWT token in expo-secure-store so the session survives app restarts.
// Run `npx expo install expo-secure-store` if it isn't installed yet.

import { ApiError, get, post } from "@/services/api";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

const TOKEN_KEY = "jalemos_token";
const DRIVER_ACTIVATED_KEY = "jalemos_driver_activated";

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "passenger" | "passenger+driver";
  avatar: string;
  profilePhotoUrl: string | null;
  profilePhotoLocked: boolean;
  rating: number;
  tripsCount: number;
  driverTripsCount: number;
  memberSince: string;
  licenseExpiryMonth: number | null;
  licenseExpiryYear: number | null;
  dekraExpiryMonth: number | null;
  dekraExpiryYear: number | null;
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
  profilePhotoUrl: string | null;
  profilePhotoLocked: boolean;
  rating: number;
  tripsCount: number;
  driverTripsCount: number;
  memberSince: string;
  licenseExpiryMonth: number | null;
  licenseExpiryYear: number | null;
  dekraExpiryMonth: number | null;
  dekraExpiryYear: number | null;
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
  resolvedMode: 'passenger' | 'driver' | null;
  login: (
    identifier: string,
    password: string,
  ) => Promise<{
    success: boolean;
    error?: string;
    user?: User;
    needsVerification?: boolean;
    userId?: string;
    email?: string;
  }>;
  logout: () => Promise<void>;
  register: (
    data: RegisterData,
  ) => Promise<{ success: boolean; needsVerification?: boolean; userId?: string; email?: string; error?: string }>;
  verifyEmail: (
    userId: string,
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (
    userId: string,
  ) => Promise<{ success: boolean; error?: string; retryAfterSeconds?: number }>;
  upgradeToDriver: () => Promise<string>;
  setDriverActivated: (v: boolean) => Promise<void>;
  /** Updates the in-memory user's profile photo URL after a successful upload. */
  setProfilePhotoUrl: (url: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  driverActivated: false,
  resolvedMode: null,
  login: async () => ({ success: false }),
  logout: async () => {},
  register: async () => ({ success: false }),
  verifyEmail: async () => ({ success: false }),
  resendVerification: async () => ({ success: false }),
  upgradeToDriver: async () => "passenger",
  setDriverActivated: async () => {},
  setProfilePhotoUrl: () => {},
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
    profilePhotoUrl: r.profilePhotoUrl ?? null,
    profilePhotoLocked: r.profilePhotoLocked ?? false,
    rating: r.rating,
    tripsCount: r.tripsCount,
    driverTripsCount: r.driverTripsCount ?? 0,
    memberSince: r.memberSince,
    licenseExpiryMonth: r.licenseExpiryMonth ?? null,
    licenseExpiryYear: r.licenseExpiryYear ?? null,
    dekraExpiryMonth: r.dekraExpiryMonth ?? null,
    dekraExpiryYear: r.dekraExpiryYear ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [driverActivated, _setDriverActivated] = useState(false);
  const [resolvedMode, setResolvedMode] = useState<'passenger' | 'driver' | null>(null);

  // Restore session on startup — refresh the JWT to get the current user profile and role
  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(DRIVER_ACTIVATED_KEY),
    ])
      .then(async ([stored, activated]) => {
        if (!stored) return;
        try {
          const res = await get<AuthResponse>("/api/auth/refresh", stored);
          await SecureStore.setItemAsync(TOKEN_KEY, res.token);
          // Resolve mode alongside user so UserModeProvider gets both in one render
          if (res.role === "passenger+driver") {
            const modeStored = await SecureStore.getItemAsync(`jalemos_mode_${res.id}`);
            setResolvedMode(modeStored === "driver" ? "driver" : "passenger");
          } else {
            setResolvedMode("passenger");
          }
          setToken(res.token);
          setUser(mapResponse(res));
          // Sync driverActivated with actual role from server
          if (res.role === "passenger+driver" && activated === "1") {
            _setDriverActivated(true);
          } else if (res.role !== "passenger+driver" && activated === "1") {
            // Admin removed driver role — clear the flag
            await SecureStore.deleteItemAsync(DRIVER_ACTIVATED_KEY);
          }
        } catch {
          // Server unavailable — restore flag from SecureStore and keep token
          if (activated === "1") _setDriverActivated(true);
          setResolvedMode("passenger");
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
      // Resolve mode before setting user so both land in the same render
      if (u.role === "passenger+driver") {
        const modeStored = await SecureStore.getItemAsync(`jalemos_mode_${u.id}`);
        setResolvedMode(modeStored === "driver" ? "driver" : "passenger");
      } else {
        setResolvedMode("passenger");
      }
      setToken(res.token);
      setUser(u);
      // Sync driverActivated with SecureStore + actual role
      if (u.role !== "passenger+driver") {
        await SecureStore.deleteItemAsync(DRIVER_ACTIVATED_KEY);
        _setDriverActivated(false);
      } else {
        const activated = await SecureStore.getItemAsync(DRIVER_ACTIVATED_KEY);
        _setDriverActivated(activated === "1");
      }
      return { success: true, user: u };
    } catch (err) {
      // Credentials are valid but the email isn't verified — surface the ids so the
      // screen can route the user to the verification flow and offer a resend.
      if (err instanceof ApiError && err.body?.needsVerification) {
        return {
          success: false,
          needsVerification: true,
          userId: err.body.userId,
          email: err.body.email,
          error: err.message,
        };
      }
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
    setResolvedMode(null);
    _setDriverActivated(false);
    // driverActivated NOT cleared from SecureStore on logout — it survives sessions
    // so the onboarding pipeline doesn't repeat. It only clears if the admin
    // removes the driver role (handled in login and startup refresh).
  };

  const setDriverActivated = async (v: boolean) => {
    if (v) {
      await SecureStore.setItemAsync(DRIVER_ACTIVATED_KEY, "1");
    } else {
      await SecureStore.deleteItemAsync(DRIVER_ACTIVATED_KEY);
    }
    _setDriverActivated(v);
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await post<{ userId: string; email: string; expiresAt: string }>("/api/auth/register", {
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      });
      return { success: true, needsVerification: true, userId: res.userId, email: res.email };
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Error de conexión con el servidor";
      return { success: false, error: msg };
    }
  };

  const verifyEmail = async (userId: string, code: string) => {
    try {
      const res = await post<AuthResponse>("/api/auth/verify-email", { userId, code });
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

  const resendVerification = async (userId: string) => {
    try {
      await post<{ expiresAt: string }>("/api/auth/resend-verification", { userId });
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          success: false,
          error: err.message,
          retryAfterSeconds: err.body?.retryAfterSeconds,
        };
      }
      return { success: false, error: "Error de conexión con el servidor" };
    }
  };

  // Fetches a fresh JWT from the server (role may have changed to 'driver' after admin approval)
  // then updates local state. Navigates to offer tab on success.
  const upgradeToDriver = async (): Promise<string> => {
    if (!token) return "passenger";
    try {
      const res = await get<AuthResponse>("/api/auth/refresh", token);
      await SecureStore.setItemAsync(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(mapResponse(res));
      return res.role; // 'passenger+driver' if still approved, 'passenger' if role was removed
    } catch {
      // Offline fallback — assume role unchanged
      setUser((prev) => (prev ? { ...prev, role: "passenger+driver" } : prev));
      return "passenger+driver";
    }
  };

  const setProfilePhotoUrl = (url: string | null) => {
    setUser((prev) => (prev ? { ...prev, profilePhotoUrl: url } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        driverActivated,
        resolvedMode,
        login,
        logout,
        register,
        verifyEmail,
        resendVerification,
        upgradeToDriver,
        setDriverActivated,
        setProfilePhotoUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
