import { useEffect, useRef, useState } from "react";
import { del, get, patch, post } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import AppHeader from "../components/AppHeader";

type NoteStatus = "pending" | "in_progress" | "done";

type Note = {
  id: number;
  title: string;
  content: string;
  status: NoteStatus;
  position_x: number;
  position_y: number;
};

type NotesResponse = {
  notes: Note[];
};

type NoteResponse = {
  note: Note;
};

type DragState = {
  id: number;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
  dragging: boolean;
  lastX: number;
  lastY: number;
  initialX: number;
  initialY: number;
};

const NOTE_WIDTH = 240;
const NOTE_HEIGHT = 220;

export default function BoardPage() {
  const { token, user, logout } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  async function loadNotes() {
    try {
      setLoading(true);
      setError("");

      const response = await get<NotesResponse>("/notes", token);
      setNotes(response.notes);
    } catch {
      setError("No se pudieron cargar las notas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      void loadNotes();
    }
  }, [token]);

  function updateLocalNote(id: number, changes: Partial<Note>) {
    setNotes((current) =>
      current.map((note) =>
        note.id === id ? { ...note, ...changes } : note
      )
    );
  }

  async function handleCreate() {
    try {
      setError("");

      const response = await post<NoteResponse>(
        "/notes",
        {
          title: "Nueva nota",
          content: "Escribe aquí...",
          status: "pending",
          position_x: 40 + notes.length * 25,
          position_y: 40 + notes.length * 25,
        },
        token
      );

      setNotes((current) => [...current, response.note]);
    } catch {
      setError("No se pudo crear la nota");
    }
  }

  async function handleSave(note: Note) {
    try {
      setSavingId(note.id);
      setError("");

      const response = await patch<NoteResponse>(
        `/notes/${note.id}`,
        {
          title: note.title,
          content: note.content,
          status: note.status,
        },
        token
      );

      setNotes((current) =>
        current.map((item) =>
          item.id === note.id ? response.note : item
        )
      );
    } catch {
      setError("No se pudo guardar la nota");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm("¿Eliminar esta nota?");
    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await del(`/notes/${id}`, token);

      setNotes((current) => current.filter((note) => note.id !== id));
    } catch {
      setError("No se pudo eliminar la nota");
    }
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLElement>,
    note: Note
  ) {
    const target = event.target as HTMLElement;

    if (
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("select") ||
      target.closest("button")
    ) {
      return;
    }

    const board = boardRef.current;
    if (!board) {
      return;
    }

    const boardRect = board.getBoundingClientRect();

    const offsetX =
      event.clientX - boardRect.left + board.scrollLeft - note.position_x;
    const offsetY =
      event.clientY - boardRect.top + board.scrollTop - note.position_y;

    dragRef.current = {
      id: note.id,
      offsetX,
      offsetY,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
      lastX: note.position_x,
      lastY: note.position_y,
      initialX: note.position_x,
      initialY: note.position_y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    const board = boardRef.current;

    if (!drag || !board) {
      return;
    }

    if (
      !drag.dragging &&
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 5
    ) {
      return;
    }

    drag.dragging = true;

    const boardRect = board.getBoundingClientRect();

    const nextX = Math.max(
      0,
      Math.round(
        event.clientX - boardRect.left + board.scrollLeft - drag.offsetX
      )
    );

    const nextY = Math.max(
      0,
      Math.round(
        event.clientY - boardRect.top + board.scrollTop - drag.offsetY
      )
    );

    drag.lastX = nextX;
    drag.lastY = nextY;

    updateLocalNote(drag.id, {
      position_x: nextX,
      position_y: nextY,
    });
  }

  async function handlePointerUp(event: React.PointerEvent<HTMLElement>) {
    const drag = dragRef.current;

    if (!drag) {
      return;
    }

    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!drag.dragging) {
      return;
    }

    const finalX = drag.lastX;
    const finalY = drag.lastY;

    updateLocalNote(drag.id, {
      position_x: finalX,
      position_y: finalY,
    });

    try {
      setError("");

      await patch<NoteResponse>(
        `/notes/${drag.id}/position`,
        {
          position_x: finalX,
          position_y: finalY,
        },
        token
      );

      updateLocalNote(drag.id, {
        position_x: finalX,
        position_y: finalY,
      });
    } catch {
      setError("No se pudo guardar la posición");
      updateLocalNote(drag.id, {
        position_x: drag.initialX,
        position_y: drag.initialY,
      });
    }
  }

  function handlePointerCancel(event: React.PointerEvent<HTMLElement>) {
    dragRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }



  function handleLogout() {
    logout();
    window.location.assign("/login");
  }

  return (
    <main className="app-page board-page">
      <AppHeader />
      <div className="app-content">
        <div className="board-toolbar">
          <div>
            <h1>Tablero compartido</h1>
            <p>Organiza las notas del equipo en un espacio común.</p>
          </div>
          <button type="button" onClick={handleCreate}>Crear nota</button>
        </div>

      {error && (
        <p
          className="feedback feedback-error"
          style={{
            padding: "10px 12px",
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "8px",
          }}
        >
          {error}
        </p>
      )}

      {loading ? (
        <p>Cargando tablero...</p>
      ) : (
        <div
          ref={boardRef}
          className="board-surface"
          style={{
            position: "relative",
            height: "calc(100vh - 150px)",
            minHeight: "600px",
            overflow: "auto",
            border: "2px solid #d1d5db",
            borderRadius: "12px",
            background:
              "linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        >
          {notes.map((note) => (
            <article
              key={note.id}
              className="note-card"
              onPointerDown={(event) => handlePointerDown(event, note)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              style={{
                position: "absolute",
                left: note.position_x,
                top: note.position_y,
                width: NOTE_WIDTH,
                minHeight: NOTE_HEIGHT,
                padding: "16px",
                boxSizing: "border-box",
                borderRadius: "12px",
                border: "1px solid #d1d5db",
                background: "#fef3c7",
                boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                cursor: "grab",
                userSelect: "none",
                touchAction: "none",
              }}
            >
              <input
                value={note.title}
                onChange={(event) =>
                  updateLocalNote(note.id, {
                    title: event.target.value,
                  })
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  marginBottom: "10px",
                  fontWeight: 700,
                }}
              />

              <textarea
                value={note.content}
                onChange={(event) =>
                  updateLocalNote(note.id, {
                    content: event.target.value,
                  })
                }
                rows={6}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  resize: "vertical",
                  marginBottom: "10px",
                }}
              />

              <select
                value={note.status}
                onChange={(event) =>
                  updateLocalNote(note.id, {
                    status: event.target.value as NoteStatus,
                  })
                }
                style={{
                  width: "100%",
                  marginBottom: "12px",
                }}
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En curso</option>
                <option value="done">Hecho</option>
              </select>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={() => void handleSave(note)}
                  disabled={savingId === note.id}
                >
                  {savingId === note.id ? "Guardando..." : "Guardar"}
                </button>

                <button
                  type="button"
                  onClick={() => void handleDelete(note.id)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}

          {notes.length === 0 && (
            <div
              style={{
                position: "absolute",
                left: 24,
                top: 24,
                padding: "16px",
                background: "white",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
              }}
            >
              No hay notas todavía. Usa "Crear nota".
            </div>
          )}
        </div>
      )}
      </div>
    </main>
  );
}