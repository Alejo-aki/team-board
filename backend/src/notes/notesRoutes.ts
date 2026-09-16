import { Router } from "express";
import { pool } from "../db.js";
import {
  authenticateToken,
  AuthenticatedRequest,
} from "../auth/authMiddleware.js";

const router = Router();

const VALID_STATUSES = ["pending", "in_progress", "done"] as const;

router.get(
  "/",
  authenticateToken,
  async (_req: AuthenticatedRequest, res) => {
    try {
      const result = await pool.query(
        `
        SELECT
          id,
          title,
          content,
          status,
          position_x,
          position_y,
          created_at,
          updated_at
        FROM notes
        ORDER BY id
        `
      );

      return res.json({
        notes: result.rows,
      });
    } catch (error) {
      console.error("List notes error:", error);

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }
);

router.post(
  "/",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const {
        title,
        content,
        status = "pending",
        position_x = 100,
        position_y = 100,
      } = req.body;

      if (!title || typeof title !== "string") {
        return res.status(400).json({
          message: "title es obligatorio",
        });
      }

      if (typeof content !== "string") {
        return res.status(400).json({
          message: "content debe ser texto",
        });
      }

      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "status inválido",
        });
      }

      if (
        typeof position_x !== "number" ||
        typeof position_y !== "number"
      ) {
        return res.status(400).json({
          message: "position_x y position_y deben ser números",
        });
      }

      const result = await pool.query(
        `
        INSERT INTO notes (
          title,
          content,
          status,
          position_x,
          position_y
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          title,
          content,
          status,
          position_x,
          position_y,
          created_at,
          updated_at
        `,
        [title, content, status, position_x, position_y]
      );

      return res.status(201).json({
        note: result.rows[0],
      });
    } catch (error) {
      console.error("Create note error:", error);

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }
);

router.patch(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const noteId = Number(req.params.id);
      const { title, content, status } = req.body;

      if (!Number.isInteger(noteId)) {
        return res.status(400).json({
          message: "ID de nota inválido",
        });
      }

      if (!title || typeof title !== "string") {
        return res.status(400).json({
          message: "title es obligatorio",
        });
      }

      if (typeof content !== "string") {
        return res.status(400).json({
          message: "content debe ser texto",
        });
      }

      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "status inválido",
        });
      }

      const result = await pool.query(
        `
        UPDATE notes
        SET
          title = $1,
          content = $2,
          status = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING
          id,
          title,
          content,
          status,
          position_x,
          position_y,
          created_at,
          updated_at
        `,
        [title, content, status, noteId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Nota no encontrada",
        });
      }

      return res.json({
        note: result.rows[0],
      });
    } catch (error) {
      console.error("Update note error:", error);

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }
);

router.patch(
  "/:id/position",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const noteId = Number(req.params.id);
      const { position_x, position_y } = req.body;

      if (!Number.isInteger(noteId)) {
        return res.status(400).json({
          message: "ID de nota inválido",
        });
      }

      if (
        typeof position_x !== "number" ||
        typeof position_y !== "number"
      ) {
        return res.status(400).json({
          message: "position_x y position_y deben ser números",
        });
      }

      const result = await pool.query(
        `
        UPDATE notes
        SET
          position_x = $1,
          position_y = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING
          id,
          title,
          content,
          status,
          position_x,
          position_y,
          created_at,
          updated_at
        `,
        [position_x, position_y, noteId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Nota no encontrada",
        });
      }

      return res.json({
        note: result.rows[0],
      });
    } catch (error) {
      console.error("Update note position error:", error);

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }
);

router.delete(
  "/:id",
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const noteId = Number(req.params.id);

      if (!Number.isInteger(noteId)) {
        return res.status(400).json({
          message: "ID de nota inválido",
        });
      }

      const result = await pool.query(
        `
        DELETE FROM notes
        WHERE id = $1
        RETURNING id
        `,
        [noteId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Nota no encontrada",
        });
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Delete note error:", error);

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }
);

export default router;