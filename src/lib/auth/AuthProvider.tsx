"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { tokenStore } from "@/lib/api/token";
import { refresh as refreshApi, logout as logoutApi } from "@/lib/api/resources/auth";
import { verifyOtp as verifyOtpApi } from "@/lib/api/resources/auth";
import { mergeCart } from "@/lib/api/resources/cart";
import type { User } from "@/lib/validation/schemas";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (phone: string, code: string, fullName?: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (u: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Shared across the (single) AuthProvider per page load. Refresh tokens rotate
// on every use, so firing /auth/refresh twice — as React StrictMode does in dev
// by double-invoking effects — makes the second call look like a replay and
// revokes the whole session. Deduping to one in-flight promise keeps exactly
// one bootstrap refresh per page load.
let bootstrapPromise: ReturnType<typeof refreshApi> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setReady] = useState(false);

  // On mount, attempt a silent refresh from the httpOnly cookie.
  useEffect(() => {
    let active = true;
    if (!bootstrapPromise) bootstrapPromise = refreshApi();
    bootstrapPromise
      .then((res) => {
        if (!active) return;
        tokenStore.set(res.accessToken);
        setUser(res.user);
      })
      .catch(() => {
        /* not signed in — expected for guests */
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (phone: string, code: string, fullName?: string) => {
    const res = await verifyOtpApi(phone, code, fullName);
    tokenStore.set(res.accessToken);
    setUser(res.user);
    // Fold any guest cart into the user's cart.
    try {
      await mergeCart();
    } catch {
      /* non-fatal */
    }
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      tokenStore.set(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: Boolean(user), isReady, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
