import express from "express";
import { pool } from "./db.js";
import {
  authenticateToken,
  AuthenticatedRequest,
  requireAdmin,
} from "./auth/authMiddleware.js";
import usersRoutes from "./users/usersRoutes.js";
import notesRoutes from "./notes/notesRoutes.js";


const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "team-board-api",
  });
});

app.get("/db-test", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");

    res.json({
      status: "ok",
      database: "connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email y password son obligatorios",
      });
    }

    const result = await pool.query(
      `
      SELECT id, name, email, password_hash, role, active
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        message: "Usuario inactivo",
      });
    }

    const { comparePassword, generateToken } = await import("./auth/auth.js");

    const passwordValid = await comparePassword(
      password,
      user.password_hash
    );

    if (!passwordValid) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    const token = generateToken(user.id, user.role);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Error interno del servidor",
    });
  }
});

app.get(
  "/me",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const result = await pool.query(
        `
        SELECT id, name, email, role, active
        FROM users
        WHERE id = $1
        `,
        [req.user!.userId]
      );

      const user = result.rows[0];

      if (!user || !user.active) {
        return res.status(403).json({
          message: "Usuario no disponible",
        });
      }

      return res.json({
        user,
      });
    } catch (error) {
      console.error("Me error:", error);

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }
);

app.get(
  "/admin-test",
  authenticateToken,
  requireAdmin,
  (_req: AuthenticatedRequest, res) => {
    res.json({
      message: "Acceso de administrador correcto",
    });
  }
);

app.use("/users", usersRoutes);
app.use("/notes", notesRoutes);


app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});