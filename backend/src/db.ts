import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PGHOST || "postgres",
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || "team_board",
  user: process.env.PGUSER || "team_board",
  password: process.env.PGPASSWORD || "team_board_dev",
});