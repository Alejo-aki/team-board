import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import AppHeader from "../components/AppHeader";
import MetricCard from "../components/MetricCard";

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
    <main className="app-page">
      <AppHeader />
      <div className="app-content">
        <section className="page-heading">
          <div>
            <h1>Dashboard</h1>
            <p>Una vista rápida del estado del tablero compartido.</p>
          </div>
        </section>

        <section className="user-summary" aria-label="Sesión actual">
          <div><dt>Nombre</dt><dd>{user?.name}</dd></div>
          <div><dt>Email</dt><dd>{user?.email}</dd></div>
          <div><dt>Rol</dt><dd>{user?.role}</dd></div>
        </section>

        {loading && <p>Cargando métricas...</p>}
        {error && <p className="feedback feedback-error" role="alert">{error}</p>}

        {metrics && !loading && !error && (
          <section className="metrics-grid" aria-label="Métricas de notas">
            <MetricCard title="Total de notas" value={metrics.total} />
            <MetricCard title="Pendientes" value={metrics.pending} variant="metric-card--pending" />
            <MetricCard title="En curso" value={metrics.in_progress} variant="metric-card--progress" />
            <MetricCard title="Hechas" value={metrics.done} variant="metric-card--done" />
          </section>
        )}

        <div className="dashboard-actions">
          <a href="/board">Abrir tablero</a>
          {user?.role === "admin" && <a href="/users">Administrar usuarios</a>}
          <button type="button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>
    </main>
  );
}
