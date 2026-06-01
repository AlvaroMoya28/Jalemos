// Global context that tracks whether the current user is acting as a passenger or a driver.
// Defaults to 'passenger' on every fresh session — no persistence yet.
// isDriverRegistered gates the driver-registration flow: first-time drivers are sent to
// the registration screen; returning drivers switch modes directly.
// profilePhoto holds the URI of the user's face photo; null means no photo set yet.
// Drivers must set a profile photo before completing registration.

import { createContext, ReactNode, useContext, useState } from 'react';

export type UserMode = 'passenger' | 'driver';

interface UserModeContextType {
  mode: UserMode;
  isDriverRegistered: boolean;
  profilePhoto: string | null;
  setMode: (mode: UserMode) => void;
  setDriverRegistered: (v: boolean) => void;
  setProfilePhoto: (uri: string | null) => void;
}

const UserModeContext = createContext<UserModeContextType>({
  mode: 'passenger',
  isDriverRegistered: false,
  profilePhoto: null,
  setMode: () => {},
  setDriverRegistered: () => {},
  setProfilePhoto: () => {},
});

export function UserModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<UserMode>('passenger');
  const [isDriverRegistered, setDriverRegistered] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  return (
    <UserModeContext.Provider value={{
      mode, isDriverRegistered, profilePhoto,
      setMode, setDriverRegistered, setProfilePhoto,
    }}>
      {children}
    </UserModeContext.Provider>
  );
}

export const useUserMode = () => useContext(UserModeContext);
