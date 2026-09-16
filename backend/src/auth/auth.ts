import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "team-board-dev-secret";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function generateToken(userId: number, role: "admin" | "user"): string {
  return jwt.sign(
    {
      userId,
      role,
    },
    JWT_SECRET,
    {
      expiresIn: "2h",
    }
  );
}

export function verifyToken(token: string): {
  userId: number;
  role: "admin" | "user";
} {
  return jwt.verify(token, JWT_SECRET) as {
    userId: number;
    role: "admin" | "user";
  };
}