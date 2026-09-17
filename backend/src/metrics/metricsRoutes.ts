import { Router } from "express";
import { authenticateToken } from "../auth/authMiddleware.js";

const router = Router();

const metricsLambdaUrl =
  process.env.METRICS_LAMBDA_URL ??
  "http://host.docker.internal:3001/metrics";

router.get("/", authenticateToken, async (_req, res) => {
  try {
    const response = await fetch(metricsLambdaUrl);

    if (!response.ok) {
      return res.status(502).json({
        message: "No se pudieron obtener las métricas",
      });
    }

    const data = await response.json();

    return res.json({
      total: Number(data.total),
      pending: Number(data.pending),
      in_progress: Number(data.in_progress),
      done: Number(data.done),
    });
  } catch {
    return res.status(502).json({
      message: "No se pudieron obtener las métricas",
    });
  }
});

export default router;