import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: {
    nodeEnv: "test",
    redisUrl: "",
    adminApiKey: "",
  },
}));

const authAttemptRateLimitMock = vi.hoisted(() => vi.fn());
const runLimiterMock = vi.hoisted(() => vi.fn());

vi.mock("./rate-limit.middleware", () => ({
  authAttemptRateLimit: authAttemptRateLimitMock,
  runLimiter: runLimiterMock,
}));

vi.mock("../utils/response", () => ({
  default: {
    failure: vi.fn(),
  },
}));

import authMiddleware from "./auth.middleware";
import response from "../utils/response";

describe("auth middleware", () => {
  it("returns 500 immediately when the admin key is missing", async () => {
    const req = {
      header: vi.fn(),
      headers: {},
    } as unknown as Request;
    const res = {
      headersSent: false,
    } as unknown as Response;
    const next = vi.fn();

    await authMiddleware.requireAdmin(req, res, next);

    expect(authAttemptRateLimitMock).not.toHaveBeenCalled();
    expect(runLimiterMock).not.toHaveBeenCalled();
    expect(response.failure).toHaveBeenCalledWith(
      res,
      "Server admin key not configured",
      500,
    );
    expect(next).not.toHaveBeenCalled();
  });
});
