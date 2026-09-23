import { useState } from "react";
import { useAuth } from "./AuthContext.js";

export const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", background: "#fff", borderRadius: 16, padding: 24, boxShadow: "0 8px 24px rgba(20,33,61,0.08)" }}>
      <h2 style={{ marginTop: 0 }}>Iniciar sesión</h2>
      <div style={{ display: "grid", gap: 12 }}>
        <label>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>Email</div>
          <input value={email} onChange={(event) => setEmail(event.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d0d5dd" }} />
        </label>
        <label>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>Contraseña</div>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d0d5dd" }} />
        </label>
        {error ? <div style={{ color: "#b42318", fontSize: 14 }}>{error}</div> : null}
        <button disabled={submitting} onClick={onSubmit} style={{ background: "#14213d", color: "#fff", border: 0, borderRadius: 10, padding: "12px 16px", fontWeight: 700, cursor: "pointer" }}>
          {submitting ? "Ingresando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
};
