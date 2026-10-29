import type { ApiError, PredictRequest, PredictResponse } from "./types";

export class ApiRequestError extends Error {
  field: string;
  constructor(error: ApiError) {
    super(error.message);
    this.field = error.error;
  }
}

export async function predict(payload: PredictRequest): Promise<PredictResponse> {
  let res: Response;
  try {
    res = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiRequestError({ error: "network", message: "The scoring service can't be reached right now. Try again in a moment." });
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok || body === null) {
    if (body && typeof body === "object" && "message" in body) throw new ApiRequestError(body as ApiError);
    throw new ApiRequestError({ error: "server", message: `The scoring service returned an error (HTTP ${res.status}).` });
  }
  return body as PredictResponse;
}
