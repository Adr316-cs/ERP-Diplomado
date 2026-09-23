import React from "react";
import { useAuth } from "../features/auth/AuthContext.js";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fb", color: "#14213d", fontFamily: "sans-serif" }}>
      <header style={{ background: "#14213d", color: "#fff", padding: "16px 24px", fontWeight: 700, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>ERP Empresarial</span>
        {user ? (
          <button onClick={() => void logout()} style={{ background: "#fff", color: "#14213d", border: 0, borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>
            Cerrar sesión
          </button>
        ) : null}
      </header>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
};
