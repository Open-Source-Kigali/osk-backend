import type { NextFunction, Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: {
    corsOrigins: ["http://localhost:5173"],
  },
}));

vi.mock("../utils/response", () => ({
  default: {
    failure: vi.fn(),
  },
}));

import { requireTrustedOrigin } from "./origin.middleware";
import response from "../utils/response";

describe("requireTrustedOrigin", () => {
  const res = {
    headersSent: false,
  } as unknown as Response;
  const next = vi.fn() as NextFunction;

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("allows a configured Origin", () => {
    const req = {
      get: vi.fn((name: string) =>
        name === "origin" ? "http://localhost:5173" : undefined,
      ),
    } as unknown as Request;

    requireTrustedOrigin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(response.failure).not.toHaveBeenCalled();
  });

  it("rejects an untrusted Origin", () => {
    const req = {
      get: vi.fn((name: string) =>
        name === "origin" ? "https://evil.example" : undefined,
      ),
    } as unknown as Request;

    requireTrustedOrigin(req, res, next);

    expect(response.failure).toHaveBeenCalledWith(
      res,
      "Origin not allowed",
      403,
    );
    expect(next).not.toHaveBeenCalled();
  });
});
