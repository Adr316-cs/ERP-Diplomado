import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../../types.js";
import { api } from "../../lib/api.js";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      const accessToken = localStorage.getItem("erp.accessToken");
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const me = await api.me();
        setUser(me);
      } catch {
        localStorage.removeItem("erp.accessToken");
        localStorage.removeItem("erp.refreshToken");
      } finally {
        setLoading(false);
      }
    };

    void boot();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password);
    localStorage.setItem("erp.accessToken", result.tokens.accessToken);
    localStorage.setItem("erp.refreshToken", result.tokens.refreshToken);
    setUser(result.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network/logout errors and use local cleanup
    }
    localStorage.removeItem("erp.accessToken");
    localStorage.removeItem("erp.refreshToken");
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(() => ({ user, loading, login, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
