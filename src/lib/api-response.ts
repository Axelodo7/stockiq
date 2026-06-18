import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function success<T>(data: T, status = 200, meta?: ApiResponse<T>["meta"]) {
  const response: ApiResponse<T> = { success: true, data, ...(meta && { meta }) };
  return NextResponse.json(response, { status });
}

export function created<T>(data: T) {
  return success(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function errorResponse(
  message: string,
  status = 400,
  code?: string,
  details?: unknown
) {
  const error: { code: string; message: string; details?: unknown } = {
    code: code || "ERROR",
    message,
  };
  if (details !== undefined) {
    error.details = details;
  }
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error,
  };
  return NextResponse.json(response, { status });
}

export function unauthorized(message = "Unauthorized") {
  return errorResponse(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "Forbidden") {
  return errorResponse(message, 403, "FORBIDDEN");
}

export function notFound(message = "Not found") {
  return errorResponse(message, 404, "NOT_FOUND");
}

export function validationError(message: string, details?: unknown) {
  return errorResponse(message, 422, "VALIDATION_ERROR", details);
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);
  if (error instanceof Error) {
    return errorResponse(error.message, 500, "INTERNAL_ERROR");
  }
  return errorResponse("Internal server error", 500, "INTERNAL_ERROR");
}
