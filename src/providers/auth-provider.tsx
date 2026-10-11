import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { isBackendUnavailable } from "@/lib/api/errors";
import type { UserType } from "@/lib/api/types";

type SignUpArgs = {
  email: string;
  password: string;
  userType: UserType;
  displayName: string;
};

/**
 * `offline` marks a request that never reached the backend — a paused instance,
 * not a wrong password. The forms use it to show an actionable message.
 */
export type AuthError = {
  message: string;
  offline: boolean;
};

type AuthErrorLike = { message: string; status?: number; name?: string } | null;

const toAuthError = (error: AuthErrorLike): AuthError | null =>
  error ? { message: error.message, offline: isBackendUnavailable(error) } : null;

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<AuthError | null>;
  signUp: (args: SignUpArgs) => Promise<AuthError | null>;
  signOut: () => Promise<void>;
  /** Sends the account-recovery email. Returns an error message, or null when accepted. */
  requestPasswordReset: (email: string) => Promise<AuthError | null>;
  /** Sets a new password for the signed-in user (used by the recovery link). */
  setPassword: (password: string) => Promise<AuthError | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // The listener is registered before the initial session read, and every
    // client call inside the callback is deferred: calling the auth client
    // directly inside onAuthStateChange deadlocks it.
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setInitializing(false);
    });

    supabase.auth.getSession().then(({ data: existing }) => {
      setSession(existing.session ?? null);
      setUser(existing.session?.user ?? null);
      setInitializing(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return toAuthError(error);
  }, []);

  const signUp = useCallback(async ({ email, password, userType, displayName }: SignUpArgs) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { user_type: userType, display_name: displayName },
      },
    });
    return toAuthError(error);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return toAuthError(error);
  }, []);

  const setPassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return toAuthError(error);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      initializing,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      setPassword,
    }),
    [user, session, initializing, signIn, signUp, signOut, requestPasswordReset, setPassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return context;
};
