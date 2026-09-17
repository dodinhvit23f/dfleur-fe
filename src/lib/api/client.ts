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
