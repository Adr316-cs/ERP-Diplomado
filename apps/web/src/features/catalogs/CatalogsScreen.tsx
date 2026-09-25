import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";

const catalogs = [
  { key: "customers", label: "Clientes" },
  { key: "suppliers", label: "Proveedores" },
  { key: "products", label: "Productos" },
  { key: "categories", label: "Categorías" },
  { key: "warehouses", label: "Almacenes" },
  { key: "master-data/brands", label: "Marcas" },
  { key: "master-data/units", label: "Unidades" },
  { key: "master-data/taxes", label: "Impuestos" },
  { key: "master-data/paymentMethods", label: "Métodos de pago" }
] as const;

type Props = { companyId: string };

export const CatalogsScreen = ({ companyId }: Props) => {
  const [resource, setResource] = useState<string>(catalogs[0].key);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeCatalog = useMemo(() => catalogs.find((item) => item.key === resource) ?? catalogs[0], [resource]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.catalog(companyId, resource, { ...(search.trim() ? { q: search.trim() } : {}), page, pageSize: 25 });
      setRows(result.data);
      setMeta(result.meta ?? null);
    } catch (cause) {
      setRows([]);
      setMeta(null);
      setError(cause instanceof Error ? cause.message : "No se pudo cargar el catálogo");
    } finally {
      setLoading(false);
    }
  }, [companyId, resource, search, page]);

  useEffect(() => { void load(); }, [load]);

  const columns = useMemo(() => {
    const keys = new Set<string>();
    rows.forEach((row) => Object.keys(row).forEach((key) => {
      if (!key.startsWith("_") && !["companyId", "branchId", "createdBy", "updatedAt", "__v"].includes(key)) keys.add(key);
    }));
    return [...keys].slice(0, 6);
  }, [rows]);

  return (
    <section style={{ display: "grid", gap: 16, color: "#172b43" }}>
      <div>
        <h2 style={{ margin: 0 }}>Catálogos</h2>
        <p style={{ margin: "6px 0 0", color: "#62758a" }}>Consulta los datos maestros de la empresa seleccionada.</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {catalogs.map((item) => <button key={item.key} onClick={() => { setResource(item.key); setPage(1); }} aria-pressed={resource === item.key} style={{ border: 0, borderRadius: 8, padding: "9px 12px", cursor: "pointer", color: resource === item.key ? "#fff" : "#344054", background: resource === item.key ? "#1769aa" : "#e8eef5" }}>{item.label}</button>)}
      </div>
      <label style={{ display: "grid", gap: 6, maxWidth: 420, fontSize: 13, fontWeight: 600 }}>
        Buscar en {activeCatalog.label.toLowerCase()}
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Nombre, código o SKU" style={{ padding: 11, borderRadius: 8, border: "1px solid #c6d2df" }} />
      </label>
      {error && <div role="alert" style={{ padding: 14, background: "#fdebea", color: "#8e2018", borderRadius: 8 }}>{error} <button onClick={() => void load()}>Reintentar</button></div>}
      <div style={{ overflowX: "auto", background: "#fff", border: "1px solid #dce4ed", borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead><tr>{columns.map((column) => <th key={column} style={{ padding: 12, borderBottom: "1px solid #dce4ed", background: "#edf2f7" }}>{column}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={Math.max(columns.length, 1)} style={{ padding: 18 }}>Cargando…</td></tr> : rows.length === 0 ? <tr><td colSpan={Math.max(columns.length, 1)} style={{ padding: 18, color: "#62758a" }}>No hay registros para mostrar.</td></tr> : rows.map((row, index) => <tr key={String(row._id ?? index)}>{columns.map((column) => <td key={column} style={{ padding: 12, borderBottom: "1px solid #eef2f6" }}>{typeof row[column] === "object" && row[column] !== null ? JSON.stringify(row[column]) : String(row[column] ?? "—")}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Anterior</button>
        <span>{meta ? `Página ${meta.page} de ${Math.max(meta.totalPages, 1)} · ${meta.total} registros` : `Página ${page}`}</span>
        <button disabled={loading || (meta !== null && page >= meta.totalPages)} onClick={() => setPage((value) => value + 1)}>Siguiente</button>
      </div>
    </section>
  );
};
