import { AuthProvider, useAuth } from "./features/auth/AuthContext.js";
import { LoginScreen } from "./features/auth/LoginScreen.js";
import { DashboardShell } from "./features/dashboard/DashboardShell.js";
import { Layout } from "./components/Layout.js";

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Layout><div style={{ padding: 32 }}>Cargando sesión...</div></Layout>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Layout>
      <DashboardShell />
    </Layout>
  );
};

export const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);