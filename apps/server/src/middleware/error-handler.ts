import type { ErrorHandler } from "hono";

export type ApiErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 500;

/** Throw this from a route to return a clean `{ error }` JSON response. */
export class ApiError extends Error {
  status: ApiErrorStatus;

  constructor(status: ApiErrorStatus, message: string) {
    super(message);
    this.status = status;
  }
}

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof ApiError) {
    return c.json({ error: err.message }, err.status);
  }

  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
};
