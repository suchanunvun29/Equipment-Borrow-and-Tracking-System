"use client";

import { useMemo } from "react";

interface AuthUser {
  id: string;
  username: string;
  role: "admin" | "staff";
}

function parseJwt(token: string): AuthUser | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));

    const id =
      json["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
      json.nameid ??
      "";
    const username =
      json["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ??
      json.unique_name ??
      "";
    const role =
      json["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      json.role ??
      "staff";

    if (!id || !username) return null;
    return { id, username, role };
  } catch {
    return null;
  }
}

export function useAuth() {
  const user = useMemo(() => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    if (!token) return null;
    return parseJwt(token);
  }, []);

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  };

  return { user, logout };
}
