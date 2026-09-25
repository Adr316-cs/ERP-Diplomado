import { Breadcrumbs, Dashboard, EmptyState, Layout } from "@erp/ui";

export const App = () => (
  <Layout title="ERP Empresarial" subtitle="Espacio de trabajo" navigation={[{ label: "Dashboard", active: true }, { label: "Módulos" }, { label: "Configuración" }]}>
    <Breadcrumbs items={["Inicio", "Dashboard"]} />
    <Dashboard>
      <EmptyState title="Bienvenido" description="La base visual está lista. Los indicadores aparecerán cuando se conecten los módulos y servicios correspondientes." />
    </Dashboard>
  </Layout>
);
