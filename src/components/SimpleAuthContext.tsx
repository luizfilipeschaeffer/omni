"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type AuthStatus = "authenticated" | "unauthenticated" | "expired";

interface AuthContextType {
  status: AuthStatus;
  login: () => void;
  logout: () => void;
  expire: () => void;
}

const AuthContext = createContext<AuthContextType>({
  status: "unauthenticated",
  login: () => {},
  logout: () => {},
  expire: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("unauthenticated");

  const login = () => setStatus("authenticated");
  const logout = () => setStatus("unauthenticated");
  const expire = () => setStatus("expired");

  return (
    <AuthContext.Provider value={{ status, login, logout, expire }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 