import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

type Metrics = {
  total: number;
  pending: number;
  in_progress: number;
  done: number;
};

export default function DashboardPage() {
  const { user, logout, token } = useAuth();

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function handleLogout() {
    logout();
    window.location.assign("/login");
  }

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/metrics", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar las métricas");
        }

        const data: Metrics = await response.json();
        setMetrics(data);
      } catch {
        setError("No se pudieron cargar las métricas");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadMetrics();
    }
  }, [token]);

return (
  <main>
    <section>
      <h1>Área autenticada</h1>
      <p>La sesión está activa.</p>

      <dl>
        <div>
          <dt>Nombre</dt>
          <dd>{user?.name}</dd>
        </div>

        <div>
          <dt>Email</dt>
          <dd>{user?.email}</dd>
        </div>

        <div>
          <dt>Rol</dt>
          <dd>{user?.role}</dd>
        </div>
      </dl>

      <hr />

      <h2>Dashboard</h2>

      {loading && <p>Cargando métricas...</p>}

      {error && <p>{error}</p>}

      {metrics && !loading && !error && (
        <dl>
          <div>
            <dt>Total de notas</dt>
            <dd>{metrics.total}</dd>
          </div>

          <div>
            <dt>Pendientes</dt>
            <dd>{metrics.pending}</dd>
          </div>

          <div>
            <dt>En curso</dt>
            <dd>{metrics.in_progress}</dd>
          </div>

          <div>
            <dt>Hechas</dt>
            <dd>{metrics.done}</dd>
          </div>
        </dl>
      )}

      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <a href="/board">Ir al tablero</a>

        {user?.role === "admin" && <a href="/users">Administrar usuarios</a>}

        <button type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </section>
  </main>
);
}
