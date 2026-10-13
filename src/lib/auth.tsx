import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigProblem } from "./supabase/client";
import type { Database } from "./supabase/types";

type AdminRole = Database["public"]["Enums"]["admin_role"];

type AuthValue = {
  user: User | null;
  role: AdminRole | null;
  /** True only for a signed-in user with a row in `admin_users`. */
  isAdmin: boolean;
  /** True while the initial session and role lookup are still resolving. */
  loading: boolean;
  configMissing: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Session and admin role.
 *
 * Being signed in is not the same as being an admin. The role lives in
 * `admin_users`, readable only for your own row, so a signed-in customer
 * account resolves to `role: null` and `isAdmin: false` rather than being
 * silently treated as staff.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configMissing = supabaseConfigProblem();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(!configMissing);

  const loadRole = useCallback(async (current: User | null) => {
    if (!current) {
      setRole(null);
      return;
    }
    const { data, error } = await getSupabase()
      .from("admin_users")
      .select("role")
      .eq("user_id", current.id)
      .maybeSingle();
    setRole(error ? null : (data?.role ?? null));
  }, []);

  useEffect(() => {
    if (configMissing) return;
    const supabase = getSupabase();
    let cancelled = false;

    supabase.auth
      .getSession()
      .then(async ({ data }: { data: { session: Session | null } }) => {
        if (cancelled) return;
        const nextUser = data.session?.user ?? null;
        setUser(nextUser);
        await loadRole(nextUser);
        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      void loadRole(nextUser);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [configMissing, loadRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
    setRole(null);
  }, []);

  const refreshRole = useCallback(async () => {
    await loadRole(user);
  }, [loadRole, user]);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      role,
      isAdmin: role !== null,
      loading,
      configMissing,
      signIn,
      signOut,
      refreshRole,
    }),
    [user, role, loading, configMissing, signIn, signOut, refreshRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
