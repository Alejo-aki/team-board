import { Request, Response, NextFunction } from "express";
import { pool } from "../db.js";
import { verifyToken } from "./auth.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    role: "admin" | "user";
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Token requerido",
    });
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Formato de token inválido",
    });
  }

  try {
    const payload = verifyToken(token);

    const result = await pool.query(
      `
      SELECT id, role, active
      FROM users
      WHERE id = $1
      `,
      [payload.userId]
    );

    const user = result.rows[0];

    if (!user || !user.active) {
      return res.status(403).json({
        message: "Usuario inactivo o no disponible",
      });
    }

    if (user.role !== payload.role) {
      return res.status(401).json({
        message: "Información de autenticación inválida",
      });
    }

    req.user = {
      userId: user.id,
      role: user.role,
    };

    next();
  } catch {
    return res.status(401).json({
      message: "Token inválido o expirado",
    });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Acceso restringido a administradores",
    });
  }

  next();
}