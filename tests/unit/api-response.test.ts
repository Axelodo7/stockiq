import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  success,
  created,
  noContent,
  errorResponse,
  unauthorized,
  forbidden,
  notFound,
  validationError,
  handleApiError,
} from "@/lib/api-response";

describe("success", () => {
  it("wraps data in the standard envelope", async () => {
    const res = success({ id: "1" }, 200);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: "1" });
  });

  it("includes meta when provided", async () => {
    const res = success([], 200, { page: 1, limit: 20, total: 0 });
    const body = await res.json();
    expect(body.meta).toEqual({ page: 1, limit: 20, total: 0 });
  });

  it("omits meta when not provided", async () => {
    const res = success("x", 200);
    const body = await res.json();
    expect(body.meta).toBeUndefined();
  });

  it("defaults to status 200", () => {
    expect(success("x").status).toBe(200);
  });
});

describe("created", () => {
  it("returns 201", async () => {
    const res = created({ id: "1" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

describe("noContent", () => {
  it("returns 204 with an empty body", async () => {
    const res = noContent();
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });
});

describe("errorResponse", () => {
  it("returns the given status", async () => {
    const res = errorResponse("Something failed", 500);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.data).toBeNull();
  });

  it("defaults to status 400", () => {
    expect(errorResponse("Bad").status).toBe(400);
  });

  it("uses a default error code", async () => {
    const res = errorResponse("Something failed", 500);
    const body = await res.json();
    expect(body.error.code).toBe("ERROR");
    expect(body.error.message).toBe("Something failed");
  });

  it("accepts a custom code", async () => {
    const res = errorResponse("Something failed", 500, "CUSTOM");
    const body = await res.json();
    expect(body.error.code).toBe("CUSTOM");
  });

  it("includes details when provided", async () => {
    const res = errorResponse("Bad", 400, "CODE", { field: "x" });
    const body = await res.json();
    expect(body.error.details).toEqual({ field: "x" });
  });

  it("omits details when not provided", async () => {
    const res = errorResponse("Bad", 400);
    const body = await res.json();
    expect(body.error.details).toBeUndefined();
  });
});

describe("unauthorized", () => {
  it("returns 401", async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("accepts a custom message", async () => {
    const res = unauthorized("Please sign in");
    const body = await res.json();
    expect(body.error.message).toBe("Please sign in");
  });
});

describe("forbidden", () => {
  it("returns 403", async () => {
    const res = forbidden();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });
});

describe("notFound", () => {
  it("returns 404 with the message", async () => {
    const res = notFound("Stock not found");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.message).toContain("Stock not found");
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

describe("validationError", () => {
  it("returns 422 with details", async () => {
    const res = validationError("Invalid input", { ticker: ["Required"] });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.message).toBe("Invalid input");
    expect(body.error.details).toEqual({ ticker: ["Required"] });
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("works without details", async () => {
    const res = validationError("Invalid input");
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.details).toBeUndefined();
  });
});

describe("handleApiError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns 500 for an Error", async () => {
    const res = handleApiError(new Error("boom"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("handles a non-Error value", async () => {
    const res = handleApiError("just a string");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.message).toBe("Internal server error");
  });

  it("logs the error for observability", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    handleApiError(new Error("logged"));
    expect(spy).toHaveBeenCalled();
  });

  it("never leaks a stack trace", async () => {
    const res = handleApiError(new Error("secret internal detail"));
    const text = await res.text();
    expect(text).not.toContain("    at ");
  });
});
