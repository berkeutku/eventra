"use client";

import { createContext, useContext } from "react";
import type { AuthUser } from "@/lib/auth";

const AuthContext = createContext<AuthUser | null>(null);

export default function AuthProvider({
  user,
  children,
}: {
  user: AuthUser | null;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuthUser(): AuthUser | null {
  return useContext(AuthContext);
}