// Global context that tracks whether the current user is acting as a passenger or a driver.
// Defaults to 'passenger' on every fresh session — no persistence yet.
// isDriverRegistered gates the driver-registration flow: first-time drivers are sent to
// the registration screen; returning drivers switch modes directly.

import { createContext, ReactNode, useContext, useState } from 'react';

export type UserMode = 'passenger' | 'driver';

interface UserModeContextType {
  mode: UserMode;
  isDriverRegistered: boolean;
  setMode: (mode: UserMode) => void;
  setDriverRegistered: (v: boolean) => void;
}

const UserModeContext = createContext<UserModeContextType>({
  mode: 'passenger',
  isDriverRegistered: false,
  setMode: () => {},
  setDriverRegistered: () => {},
});

export function UserModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<UserMode>('passenger');
  const [isDriverRegistered, setDriverRegistered] = useState(false);

  return (
    <UserModeContext.Provider value={{ mode, isDriverRegistered, setMode, setDriverRegistered }}>
      {children}
    </UserModeContext.Provider>
  );
}

export const useUserMode = () => useContext(UserModeContext);
