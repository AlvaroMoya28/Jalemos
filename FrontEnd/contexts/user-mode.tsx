// Global context tracking whether the current user acts as passenger or driver.
//
// Security model:
//   - admin         → always 'passenger' mode (tabs handle admin routing)
//   - passenger     → always 'passenger' mode, never allowed to be 'driver'
//   - passenger+driver → can toggle; last chosen mode is persisted per user
//     in SecureStore under key `jalemos_mode_<userId>` so each account
//     independently remembers where it left off.
//
// When a different account logs in on the same device the useEffect that
// watches user?.id resets mode to the correct value for that account,
// eliminating the cross-account role leak described in the security bug.

import { useAuth } from '@/contexts/auth';
import * as SecureStore from 'expo-secure-store';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type UserMode = 'passenger' | 'driver';

interface UserModeContextType {
  mode: UserMode;
  modeLoaded: boolean;
  isDriverRegistered: boolean;
  profilePhoto: string | null;
  setMode: (mode: UserMode) => void;
  setDriverRegistered: (v: boolean) => void;
  setProfilePhoto: (uri: string | null) => void;
}

const UserModeContext = createContext<UserModeContextType>({
  mode: 'passenger',
  modeLoaded: false,
  isDriverRegistered: false,
  profilePhoto: null,
  setMode: () => {},
  setDriverRegistered: () => {},
  setProfilePhoto: () => {},
});

export function UserModeProvider({ children }: { children: ReactNode }) {
  const { user, resolvedMode } = useAuth();
  const [mode, setModeState] = useState<UserMode>('passenger');
  const [modeLoaded, setModeLoaded] = useState(false);
  const [isDriverRegistered, setDriverRegistered] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Reset / restore mode whenever the logged-in account changes.
  useEffect(() => {
    if (!user) {
      setModeState('passenger');
      setModeLoaded(false);
      setDriverRegistered(false);
      setProfilePhoto(null);
      return;
    }

    if (user.role === 'admin' || user.role === 'passenger') {
      setModeState('passenger');
      setDriverRegistered(false);
      setModeLoaded(true);
      return;
    }

    if (user.role === 'passenger+driver') {
      setDriverRegistered(true);
      // resolvedMode is pre-loaded in AuthProvider alongside setUser, so it arrives
      // in the same render batch — no async SecureStore read needed here.
      if (resolvedMode != null) {
        setModeState(resolvedMode);
        setModeLoaded(true);
      }
    }
  }, [user, resolvedMode]);

  const setMode = (m: UserMode) => {
    setModeState(m);
    if (user?.id) {
      SecureStore.setItemAsync(`jalemos_mode_${user.id}`, m).catch(() => {});
    }
  };

  return (
    <UserModeContext.Provider value={{
      mode, modeLoaded, isDriverRegistered, profilePhoto,
      setMode, setDriverRegistered, setProfilePhoto,
    }}>
      {children}
    </UserModeContext.Provider>
  );
}

export const useUserMode = () => useContext(UserModeContext);
