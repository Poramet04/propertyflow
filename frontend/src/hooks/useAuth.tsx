import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/api";
import type { AuthResult, User } from "../types";
const TOKEN_KEY = "propertyflow_token";
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  token: string | null;
  authenticate: (result: AuthResult) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [token, setToken] = useState<string | null>(() =>
      localStorage.getItem(TOKEN_KEY),
    ),
    [loading, setLoading] = useState(true);
  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    authApi
      .me(token)
      .then(setUser)
      .catch(clearSession)
      .finally(() => setLoading(false));
  }, [token]);
  useEffect(() => {
    window.addEventListener("propertyflow:unauthorized", clearSession);
    return () =>
      window.removeEventListener("propertyflow:unauthorized", clearSession);
  }, []);
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      token,
      authenticate: (result) => {
        localStorage.setItem(TOKEN_KEY, result.token);
        setToken(result.token);
        setUser(result.user);
      },
      logout: clearSession,
    }),
    [user, loading, token],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
