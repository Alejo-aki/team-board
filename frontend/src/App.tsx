import { useAuth } from "./auth/AuthContext";
import BoardPage from "./pages/BoardPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/UsersPage";

export default function App() {
  const { user, loading } = useAuth();
  const path = window.location.pathname;

  if (loading) {
    return <main><p>Comprobando sesión...</p></main>;
  }

  if (!user) {
    if (path !== "/login") {
      window.history.replaceState({}, "", "/login");
    }

    return <LoginPage />;
  }

  if (path === "/board") {
    return <BoardPage />;
  }

  if (path === "/users") {
    if (user.role !== "admin") {
      window.history.replaceState({}, "", "/dashboard");
      return <DashboardPage />;
    }

    return <UsersPage />;
  }

  if (path !== "/dashboard") {
    window.history.replaceState({}, "", "/dashboard");
  }

  return <DashboardPage />;
}
