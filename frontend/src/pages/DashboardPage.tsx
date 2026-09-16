import { useAuth } from "../auth/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    window.location.assign("/login");
  }

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

        <button type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}
