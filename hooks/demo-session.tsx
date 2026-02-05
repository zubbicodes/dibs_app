import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type DemoSessionValue = {
  isSignedIn: boolean;
  signIn: () => void;
  signOut: () => void;
};

const DemoSessionContext = createContext<DemoSessionValue | null>(null);

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);

  const value = useMemo(
    () => ({
      isSignedIn,
      signIn: () => setIsSignedIn(true),
      signOut: () => setIsSignedIn(false),
    }),
    [isSignedIn]
  );

  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>;
}

export function useDemoSession() {
  const ctx = useContext(DemoSessionContext);
  if (!ctx) {
    return {
      isSignedIn: false,
      signIn: () => {},
      signOut: () => {},
    } satisfies DemoSessionValue;
  }
  return ctx;
}
