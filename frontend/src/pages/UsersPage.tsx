import { useEffect, useState, type FormEvent } from "react";
import { ApiError, get, patch, post } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import type { User, UserRole } from "../auth/types";

type UsersResponse = {
  users: User[];
};

type UserResponse = {
  user: User;
};

type CreateUserForm = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

type EditUserForm = {
  name: string;
  email: string;
  role: UserRole;
};

const emptyCreateForm: CreateUserForm = {
  name: "",
  email: "",
  password: "",
  role: "user",
};

export default function UsersPage() {
  const { token, user, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setError("");
        const response = await get<UsersResponse>("/users", token);
        setUsers(response.users);
      } catch (loadError) {
        setError(getErrorMessage(loadError, "No se pudieron cargar los usuarios"));
      } finally {
        setLoading(false);
      }
    }

    if (token && user?.role === "admin") {
      void loadUsers();
    }
  }, [token, user?.role]);

  function clearFeedback() {
    setError("");
    setSuccess("");
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setSaving(true);

    try {
      const response = await post<UserResponse>("/users", createForm, token);
      setUsers((current) => [...current, response.user]);
      setCreateForm(emptyCreateForm);
      setSuccess("Usuario creado correctamente");
    } catch (createError) {
      setError(getErrorMessage(createError, "No se pudo crear el usuario"));
    } finally {
      setSaving(false);
    }
  }

  function startEditing(target: User) {
    clearFeedback();
    setEditingId(target.id);
    setEditForm({
      name: target.name,
      email: target.email,
      role: target.role,
    });
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm(null);
  }

  async function handleEdit(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    if (!editForm) {
      return;
    }

    clearFeedback();
    setSaving(true);

    try {
      const response = await patch<UserResponse>(
        `/users/${id}`,
        editForm,
        token
      );
      setUsers((current) =>
        current.map((item) => (item.id === id ? response.user : item))
      );
      cancelEditing();
      setSuccess("Usuario actualizado correctamente");
    } catch (editError) {
      setError(getErrorMessage(editError, "No se pudo actualizar el usuario"));
    } finally {
      setSaving(false);
    }
  }


async function handleStatusChange(target: User) {
  clearFeedback();

  const isCurrentUser =
    target.id === user?.id || target.email === user?.email;

  const isDeactivatingSelf =
    isCurrentUser &&
    target.active === true &&
    user?.role === "admin";

  const activeAdminCount = users.filter(
    (item) => item.role === "admin" && item.active === true
  ).length;

  if (isDeactivatingSelf && activeAdminCount <= 1) {
    window.alert(
      "No puedes desactivar tu cuenta porque eres el único administrador activo. Debe existir al menos otro administrador activo."
    );
    return;
  }

  if (
    isDeactivatingSelf &&
    !window.confirm(
      "¿Estás seguro de que quieres desactivar tu cuenta? Tu sesión se cerrará y volverás al login."
    )
  ) {
    return;
  }

  setSaving(true);

  try {
    const response = await patch<UserResponse>(
      `/users/${target.id}/status`,
      { active: !target.active },
      token
    );

    setUsers((current) =>
      current.map((item) =>
        item.id === target.id ? response.user : item
      )
    );

    if (isDeactivatingSelf) {
      logout();
      window.location.assign("/login");
      return;
    }

    setSuccess("Estado del usuario actualizado correctamente");
  } catch (statusError) {
    setError(
      getErrorMessage(
        statusError,
        "No se pudo actualizar el estado"
      )
    );
  } finally {
    setSaving(false);
  }
}



  function handleLogout() {
    logout();
    window.location.assign("/login");
  }

  return (
    <main style={{ minHeight: "100vh", padding: "24px", background: "#f3f4f6" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1>Administración de usuarios</h1>
          <p>{user?.name} · {user?.role}</p>
        </div>
        <nav style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a href="/dashboard">Dashboard</a>
          <a href="/board">Tablero</a>
          <button type="button" onClick={handleLogout}>Cerrar sesión</button>
        </nav>
      </header>

      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}

      <section>
        <h2>Crear usuario</h2>
        <form onSubmit={handleCreate} style={{ display: "grid", gap: "8px", maxWidth: "420px" }}>
          <label htmlFor="create-name">Nombre</label>
          <input
            id="create-name"
            value={createForm.name}
            onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })}
            required
          />
          <label htmlFor="create-email">Email</label>
          <input
            id="create-email"
            type="email"
            value={createForm.email}
            onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })}
            required
          />
          <label htmlFor="create-password">Contraseña</label>
          <input
            id="create-password"
            type="password"
            value={createForm.password}
            onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })}
            required
          />
          <label htmlFor="create-role">Rol</label>
          <select
            id="create-role"
            value={createForm.role}
            onChange={(event) => setCreateForm({ ...createForm, role: event.target.value as UserRole })}
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
          <button type="submit" disabled={saving}>Crear usuario</button>
        </form>
      </section>

      <section>
        <h2>Usuarios</h2>
        {loading ? (
          <p>Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p>No hay usuarios.</p>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {users.map((target) => (
              <article key={target.id} style={{ padding: "16px", background: "white", border: "1px solid #d1d5db", borderRadius: "8px" }}>
                {editingId === target.id && editForm ? (
                  <form onSubmit={(event) => void handleEdit(event, target.id)} style={{ display: "grid", gap: "8px" }}>
                    <label htmlFor={`edit-name-${target.id}`}>Nombre</label>
                    <input
                      id={`edit-name-${target.id}`}
                      value={editForm.name}
                      onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                      required
                    />
                    <label htmlFor={`edit-email-${target.id}`}>Email</label>
                    <input
                      id={`edit-email-${target.id}`}
                      type="email"
                      value={editForm.email}
                      onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                      required
                    />
                    <label htmlFor={`edit-role-${target.id}`}>Rol</label>
                    <select
                      id={`edit-role-${target.id}`}
                      value={editForm.role}
                      onChange={(event) => setEditForm({ ...editForm, role: event.target.value as UserRole })}
                    >
                      <option value="user">Usuario</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="submit" disabled={saving}>Guardar cambios</button>
                      <button type="button" onClick={cancelEditing}>Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                    <div>
                      <strong>{target.name}</strong>
                      <p>{target.email}</p>
                      <p>Rol: {target.role}</p>
                      <p>Estado: {target.active ? "Activo" : "Inactivo"}</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "start", flexWrap: "wrap" }}>
                      <button type="button" onClick={() => startEditing(target)}>Editar</button>
                      <button type="button" onClick={() => void handleStatusChange(target)} disabled={saving}>
                        {target.active ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}
