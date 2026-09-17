import pg from "pg";
import type { Metrics } from "./types.js";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl:
    process.env.PGSSL === "require"
      ? { rejectUnauthorized: false }
      : undefined,
});

export async function getMetrics(): Promise<Metrics> {
  const result = await pool.query<Metrics>(`
SELECT
  COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
  COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
  COUNT(*) FILTER (WHERE status = 'done')::int AS done
FROM notes;
`);

  return result.rows[0];
}
