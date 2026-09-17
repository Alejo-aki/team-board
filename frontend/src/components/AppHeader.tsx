import { useAuth } from "../auth/AuthContext";

export default function AppHeader() {
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    window.location.assign("/login");
  }

  return (
    <header className="app-header">
      <a className="brand" href="/dashboard">Team Board</a>
      <nav className="header-nav" aria-label="Navegación principal">
        <a href="/dashboard">Dashboard</a>
        <a href="/board">Tablero</a>
        {user?.role === "admin" && <a href="/users">Usuarios</a>}
        <span className="header-user">
          <strong>{user?.name}</strong>
          <small>{user?.role}</small>
        </span>
        <button className="button-quiet" type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </nav>
    </header>
  );
}
