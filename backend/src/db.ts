import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: "postgres",
  port: 5432,
  database: "team_board",
  user: "team_board",
  password: "team_board_dev",
});