import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: {
    nodeEnv: "test",
    redisUrl: "",
    adminApiKeys: ["admin-key-one", "admin-key-two"],
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
import { env } from "../config/env";
import response from "../utils/response";

function makeReq(apiKey?: string) {
  return {
    header: vi.fn((name: string) =>
      name === "x-api-key" ? apiKey : undefined,
    ),
    headers: {},
  } as unknown as Request;
}

beforeEach(() => {
  authAttemptRateLimitMock.mockReset();
  runLimiterMock.mockReset();
  vi.mocked(response.failure).mockReset();
});

describe("auth middleware", () => {
  it("allows access when the x-api-key matches the first key", async () => {
    const req = makeReq("admin-key-one");
    const res = { headersSent: false } as unknown as Response;
    const next = vi.fn();

    await authMiddleware.requireAdmin(req, res, next);

    expect(authAttemptRateLimitMock).not.toHaveBeenCalled();
    expect(runLimiterMock).not.toHaveBeenCalled();
    expect(response.failure).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it("allows access when the x-api-key matches a second key (rotation)", async () => {
    const req = makeReq("admin-key-two");
    const res = { headersSent: false } as unknown as Response;
    const next = vi.fn();

    await authMiddleware.requireAdmin(req, res, next);

    expect(authAttemptRateLimitMock).not.toHaveBeenCalled();
    expect(runLimiterMock).not.toHaveBeenCalled();
    expect(response.failure).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects an x-api-key that is not in the list", async () => {
    const req = makeReq("compromised-key");
    const res = { headersSent: false } as unknown as Response;
    const next = vi.fn();

    await authMiddleware.requireAdmin(req, res, next);

    expect(runLimiterMock).toHaveBeenCalledWith(
      authAttemptRateLimitMock,
      req,
      res,
    );
    expect(response.failure).toHaveBeenCalledWith(
      res,
      "Admin access required",
      403,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a missing x-api-key", async () => {
    const req = makeReq();
    const res = { headersSent: false } as unknown as Response;
    const next = vi.fn();

    await authMiddleware.requireAdmin(req, res, next);

    expect(runLimiterMock).toHaveBeenCalledWith(
      authAttemptRateLimitMock,
      req,
      res,
    );
    expect(response.failure).toHaveBeenCalledWith(
      res,
      "Admin access required",
      403,
    );
    expect(next).not.toHaveBeenCalled();
  });
});

describe("auth middleware with no configured keys", () => {
  it("returns 500 immediately when no admin keys are configured", async () => {
    const originalKeys = env.adminApiKeys;
    env.adminApiKeys = [];
    try {
      const req = makeReq("admin-key-one");
      const res = { headersSent: false } as unknown as Response;
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
    } finally {
      env.adminApiKeys = originalKeys;
    }
  });
});
