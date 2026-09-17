import { useState, type FormEvent } from "react";
import { ApiError } from "../api/http";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login({ email, password });
      window.location.assign("/dashboard");
    } catch (loginError) {
      setError(
        loginError instanceof ApiError
          ? loginError.message
          : "No se pudo iniciar sesión"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel surface">
        <h1>Team Board</h1>
        <p>Tu espacio compartido para organizar el trabajo del equipo.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />

          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />

          {error && <p className="feedback feedback-error" role="alert">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  );
}
