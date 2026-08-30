"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest, clearToken, readToken, writeToken } from "./api-client";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatar_path: string | null;
  is_active: boolean;
  is_two_factor_enabled: boolean;
  last_login_at: string | null;
  roles?: { id: string; name: string; slug: string }[];
};

export type TwoFactorChallenge = {
  challenge_token: string;
  channel: string;
  masked_email: string;
  code_length: number;
  expires_at: string;
  expires_in_seconds: number;
  resend_available_in_seconds: number;
  remaining_attempts: number;
  remaining_resends: number;
  requires_two_factor?: boolean;
};

type SignedInPayload = {
  access_token: string;
  token_type: string;
  expires_at: string;
  user: AdminUser;
  permissions: string[];
};

type AuthContextValue = {
  user: AdminUser | null;
  permissions: string[];
  status: "checking" | "authenticated" | "guest";
  login: (email: string, password: string) => Promise<TwoFactorChallenge>;
  verifyCode: (challengeToken: string, code: string) => Promise<AdminUser>;
  resendCode: (challengeToken: string) => Promise<TwoFactorChallenge>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [status, setStatus] = useState<AuthContextValue["status"]>("checking");

  useEffect(() => {
    if (readToken() === null) {
      setStatus("guest");
      return;
    }

    apiRequest<{ user: AdminUser; permissions: string[] }>("/auth/me", { auth: true })
      .then(({ data }) => {
        setUser(data.user);
        setPermissions(data.permissions);
        setStatus("authenticated");
      })
      .catch(() => {
        clearToken();
        setStatus("guest");
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await apiRequest<TwoFactorChallenge>("/auth/login", {
      method: "POST",
      body: { email, password, device_name: "admin-panel" },
    });

    return data;
  }, []);

  const verifyCode = useCallback(async (challengeToken: string, code: string) => {
    const { data } = await apiRequest<SignedInPayload>("/auth/two-factor/verify", {
      method: "POST",
      body: { challenge_token: challengeToken, code, device_name: "admin-panel" },
    });

    writeToken(data.access_token, data.expires_at);
    setUser(data.user);
    setPermissions(data.permissions);
    setStatus("authenticated");

    return data.user;
  }, []);

  const resendCode = useCallback(async (challengeToken: string) => {
    const { data } = await apiRequest<TwoFactorChallenge>("/auth/two-factor/resend", {
      method: "POST",
      body: { challenge_token: challengeToken },
    });

    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest("/auth/logout", { method: "POST", auth: true });
    } finally {
      clearToken();
      setUser(null);
      setPermissions([]);
      setStatus("guest");
    }
  }, []);

  const can = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions],
  );

  const value = useMemo(
    () => ({ user, permissions, status, login, verifyCode, resendCode, logout, can }),
    [user, permissions, status, login, verifyCode, resendCode, logout, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
