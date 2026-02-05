import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type DemoSessionValue = {
  isSignedIn: boolean;
  isVaultVerified: boolean;
  signIn: () => void;
  signOut: () => void;
  verifyVault: () => void;
  resetVaultVerification: () => void;
};

const DemoSessionContext = createContext<DemoSessionValue | null>(null);

export function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isVaultVerified, setIsVaultVerified] = useState(false);

  const value = useMemo(
    () => ({
      isSignedIn,
      isVaultVerified,
      signIn: () => setIsSignedIn(true),
      signOut: () => setIsSignedIn(false),
      verifyVault: () => setIsVaultVerified(true),
      resetVaultVerification: () => setIsVaultVerified(false),
    }),
    [isSignedIn, isVaultVerified]
  );

  return <DemoSessionContext.Provider value={value}>{children}</DemoSessionContext.Provider>;
}

export function useDemoSession() {
  const ctx = useContext(DemoSessionContext);
  if (!ctx) {
    return {
      isSignedIn: false,
      isVaultVerified: false,
      signIn: () => {},
      signOut: () => {},
      verifyVault: () => {},
      resetVaultVerification: () => {},
    } satisfies DemoSessionValue;
  }
  return ctx;
}
