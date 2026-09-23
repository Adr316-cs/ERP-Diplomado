export const DashboardShell = () => (
  <section style={{ display: "grid", gap: 18 }}>
    <h2 style={{ margin: 0 }}>Dashboard</h2>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
      {[
        { label: "Ventas", value: "$0.00" },
        { label: "Compras", value: "$0.00" },
        { label: "Inventario", value: "0 unidades" },
        { label: "Tickets", value: "0" }
      ].map((card) => (
        <div key={card.label} style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 2px 8px rgba(20,33,61,0.08)" }}>
          <div style={{ color: "#667085", fontSize: 12 }}>{card.label}</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{card.value}</div>
        </div>
      ))}
    </div>
  </section>
);
