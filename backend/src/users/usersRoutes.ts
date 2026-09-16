import { Router } from "express";
import { pool } from "../db.js";
import {
  authenticateToken,
  AuthenticatedRequest,
  requireAdmin,
} from "../auth/authMiddleware.js";
import { hashPassword } from "../auth/auth.js";

const router = Router();

router.get(
  "/",
  authenticateToken,
  requireAdmin,
  async (_req: AuthenticatedRequest, res) => {
    try {
      const result = await pool.query(
        `
        SELECT id, name, email, role, active, created_at
        FROM users
        ORDER BY id
        `
      );

      return res.json({
        users: result.rows,
      });
    } catch (error) {
      console.error("List users error:", error);

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }
);

router.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({
          message: "name, email, password y role son obligatorios",
        });
      }

      if (role !== "admin" && role !== "user") {
        return res.status(400).json({
          message: "El role debe ser admin o user",
        });
      }

      const existingUser = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          message: "Ya existe un usuario con ese email",
        });
      }

      const passwordHash = await hashPassword(password);

      const result = await pool.query(
        `
        INSERT INTO users (name, email, password_hash, role, active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING id, name, email, role, active, created_at
        `,
        [name, email, passwordHash, role]
      );

      return res.status(201).json({
        user: result.rows[0],
      });
    } catch (error) {
      console.error("Create user error:", error);

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }
);

router.patch(
  "/:id/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { active } = req.body;

      if (!Number.isInteger(userId)) {
        return res.status(400).json({
          message: "ID de usuario inválido",
        });
      }

      if (typeof active !== "boolean") {
        return res.status(400).json({
          message: "active debe ser true o false",
        });
      }

      const userResult = await pool.query(
        `
        SELECT id, name, email, role, active
        FROM users
        WHERE id = $1
        `,
        [userId]
      );

      const user = userResult.rows[0];

      if (!user) {
        return res.status(404).json({
          message: "Usuario no encontrado",
        });
      }

      if (user.active === active) {
        return res.status(200).json({
          message: "El usuario ya tiene ese estado",
          user,
        });
      }

      if (user.role === "admin" && user.active && !active) {
        const adminResult = await pool.query(
          `
          SELECT COUNT(*)::int AS count
          FROM users
          WHERE role = 'admin'
            AND active = true
          `
        );

        const activeAdmins = adminResult.rows[0].count;

        if (activeAdmins <= 1) {
          return res.status(409).json({
            message: "No se puede desactivar al último administrador activo",
          });
        }
      }

      const result = await pool.query(
        `
        UPDATE users
        SET active = $1
        WHERE id = $2
        RETURNING id, name, email, role, active, created_at
        `,
        [active, userId]
      );

      return res.json({
        user: result.rows[0],
      });
    } catch (error) {
      console.error("Update user status error:", error);

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }
);

router.patch(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { name, email, role } = req.body;

      if (!Number.isInteger(userId)) {
        return res.status(400).json({
          message: "ID de usuario inválido",
        });
      }

      if (!name || !email || !role) {
        return res.status(400).json({
          message: "name, email y role son obligatorios",
        });
      }

      if (role !== "admin" && role !== "user") {
        return res.status(400).json({
          message: "El role debe ser admin o user",
        });
      }

      const userResult = await pool.query(
        `
        SELECT id, name, email, role, active
        FROM users
        WHERE id = $1
        `,
        [userId]
      );

      const user = userResult.rows[0];

      if (!user) {
        return res.status(404).json({
          message: "Usuario no encontrado",
        });
      }

      const emailResult = await pool.query(
        `
        SELECT id
        FROM users
        WHERE email = $1
          AND id <> $2
        `,
        [email, userId]
      );

      if (emailResult.rows.length > 0) {
        return res.status(409).json({
          message: "Ya existe un usuario con ese email",
        });
      }

      if (user.role === "admin" && user.active && role === "user") {
        const adminResult = await pool.query(
          `
          SELECT COUNT(*)::int AS count
          FROM users
          WHERE role = 'admin'
            AND active = true
          `
        );

        const activeAdmins = adminResult.rows[0].count;

        if (activeAdmins <= 1) {
          return res.status(409).json({
            message: "No se puede quitar el rol al último administrador activo",
          });
        }
      }

      const result = await pool.query(
        `
        UPDATE users
        SET name = $1,
            email = $2,
            role = $3
        WHERE id = $4
        RETURNING id, name, email, role, active, created_at
        `,
        [name, email, role, userId]
      );

      return res.json({
        user: result.rows[0],
      });
    } catch (error) {
      console.error("Edit user error:", error);

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }
);

export default router;