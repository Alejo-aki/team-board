import { getMetrics } from "./db.js";
import type { HttpApiEvent, HttpApiResponse } from "./types.js";

export async function handler(event: HttpApiEvent): Promise<HttpApiResponse> {
  const method = event.requestContext?.http?.method;

  if (method && method !== "GET") {
    return jsonResponse(405, { message: "Method not allowed" });
  }

  try {
    const metrics = await getMetrics();
    return jsonResponse(200, metrics);
  } catch (error) {
    console.error("Metrics database error:", error);
    return jsonResponse(500, { message: "Error interno del servidor" });
  }
}

function jsonResponse(statusCode: number, body: unknown): HttpApiResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };
}
