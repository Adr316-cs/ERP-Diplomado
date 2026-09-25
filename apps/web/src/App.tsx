import { useState } from "react";
import { Breadcrumbs, Dashboard, EmptyState, Layout, Loading } from "@erp/ui";
import { AuthProvider, useAuth } from "./features/auth/AuthContext.js";
import { LoginScreen } from "./features/auth/LoginScreen.js";
import { CatalogsScreen } from "./features/catalogs/CatalogsScreen.js";

const Workspace = () => {
  const { user, loading, logout } = useAuth();
  const [companyId, setCompanyId] = useState("");
  const [section, setSection] = useState<"dashboard" | "catalogs">("dashboard");
  if (loading) return <Loading label="Cargando sesión..." />;
  if (!user) return <LoginScreen />;

  const memberships = user.memberships ?? [];
  const selectedCompanyId = memberships.some((membership) => membership.companyId === companyId) ? companyId : memberships[0]?.companyId ?? "";
  const navigation = [
    { label: "Dashboard", active: section === "dashboard", onPress: () => setSection("dashboard") },
    { label: "Catálogos", active: section === "catalogs", onPress: () => setSection("catalogs") }
  ];

  return <Layout title="ERP Empresarial" subtitle={`Sesión: ${user.name}`} navigation={navigation}>
    <div style={{ display: "flex", justifyContent: "flex-end" }}><button onClick={() => void logout()}>Cerrar sesión</button></div>
    {memberships.length > 1 && <label style={{ display: "grid", gap: 6, maxWidth: 360 }}>Empresa
      <select value={selectedCompanyId} onChange={(event) => setCompanyId(event.target.value)} style={{ padding: 10, borderRadius: 8, border: "1px solid #c6d2df" }}>
        {memberships.map((membership) => <option key={membership.companyId} value={membership.companyId}>{membership.companyId}</option>)}
      </select>
    </label>}
    <Breadcrumbs items={["Inicio", section === "catalogs" ? "Catálogos" : "Dashboard"]} />
    {section === "catalogs" && selectedCompanyId ? <CatalogsScreen companyId={selectedCompanyId} /> : section === "catalogs" ? <EmptyState title="Sin empresa asignada" description="Tu usuario necesita pertenecer a una empresa para consultar sus catálogos." /> : <Dashboard><EmptyState title="Bienvenido" description="Selecciona Catálogos para consultar los datos maestros de tu empresa." /></Dashboard>}
  </Layout>;
};

export const App = () => <AuthProvider><Workspace /></AuthProvider>;
