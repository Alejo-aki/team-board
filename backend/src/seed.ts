import { pool } from "./db.js";
import { hashPassword } from "./auth/auth.js";

async function seed() {
  const adminPassword = await hashPassword("Admin123!");
  const userPassword = await hashPassword("User123!");

  await pool.query(
    `
    INSERT INTO users (name, email, password_hash, role, active)
    VALUES
      ($1, $2, $3, 'admin', true),
      ($4, $5, $6, 'user', true)
    ON CONFLICT (email) DO NOTHING
    `,
    [
      "Admin Demo",
      "admin@team-board.local",
      adminPassword,
      "User Demo",
      "user@team-board.local",
      userPassword,
    ]
  );

  console.log("Demo users created successfully.");

  await pool.end();
}

seed().catch((error) => {
  console.error("Seed error:", error);
  process.exit(1);
});