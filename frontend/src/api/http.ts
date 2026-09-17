const API_BASE_URL = "/api";
const TOKEN_KEY = "team-board-token";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...fetchOptions } = options;
  const storedToken = token === undefined ? localStorage.getItem(TOKEN_KEY) : token;
  const requestHeaders = new Headers(headers);

  requestHeaders.set("Accept", "application/json");

  if (fetchOptions.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (storedToken) {
    requestHeaders.set("Authorization", `Bearer ${storedToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: requestHeaders,
  });

  const responseBody = await response.text();
  let data: unknown;

  if (responseBody) {
    try {
      data = JSON.parse(responseBody);
    } catch {
      data = undefined;
    }
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
        ? data.message
        : `La solicitud falló (${response.status})`;

    throw new ApiError(message, response.status);
  }

  return data as T;
}

export function get<T>(path: string, token?: string | null): Promise<T> {
  return request<T>(path, { method: "GET", token });
}

export function post<T>(
  path: string,
  body: unknown,
  token?: string | null
): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    token,
  });
}

export function patch<T>(
  path: string,
  body: unknown,
  token?: string | null
): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
    token,
  });
}

export function del<T = void>(
  path: string,
  token?: string | null
): Promise<T> {
  return request<T>(path, {
    method: "DELETE",
    token,
  });
}



export { TOKEN_KEY };
