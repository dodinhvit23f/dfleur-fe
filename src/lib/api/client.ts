interface ApiErrorResponse {
  traceId?: string;
  errorCodes?: string[];
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function parseErrorCode(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body: ApiErrorResponse = await response.json();
    return body?.errorCodes?.[0] ?? fallback;
  } catch {
    return fallback;
  }
}

export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function postJson<T>(
  url: string,
  body: unknown,
  options: { authorization?: string; fallbackErrorCode: string },
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.authorization
        ? { Authorization: options.authorization }
        : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const code = await parseErrorCode(response, options.fallbackErrorCode);
    throw new ApiError(code, response.status);
  }

  return response.json();
}

// Multipart upload — no Content-Type header, so the browser sets the boundary.
export async function postFormData<T>(
  url: string,
  body: FormData,
  options: { authorization?: string; fallbackErrorCode: string },
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: options.authorization
      ? { Authorization: options.authorization }
      : undefined,
    body,
  });

  if (!response.ok) {
    const code = await parseErrorCode(response, options.fallbackErrorCode);
    throw new ApiError(code, response.status);
  }

  return response.json();
}

interface RequestJsonOptions {
  authorization?: string;
  fallbackErrorCode: string;
  body?: unknown;
}

async function requestJson<T>(
  method: "GET" | "PUT",
  url: string,
  options: RequestJsonOptions,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.authorization
        ? { Authorization: options.authorization }
        : {}),
    },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });

  if (!response.ok) {
    const code = await parseErrorCode(response, options.fallbackErrorCode);
    throw new ApiError(code, response.status);
  }

  return response.json();
}

export function getJson<T>(
  url: string,
  options: { authorization?: string; fallbackErrorCode: string },
): Promise<T> {
  return requestJson<T>("GET", url, options);
}

export function putJson<T>(
  url: string,
  body: unknown,
  options: { authorization?: string; fallbackErrorCode: string },
): Promise<T> {
  return requestJson<T>("PUT", url, { ...options, body });
}
