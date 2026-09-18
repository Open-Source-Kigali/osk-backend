import { NextFunction, Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import response from "../utils/response";
import { errorHandler } from "./error.middleware";
import { Prisma } from "../generated/prisma/client";

describe("middleware tests", () => {
  const req = {} as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 409 for email that already exists", () => {
    const failureSpy = vi.spyOn(response, "failure");
    const errorObject = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "4.15.0",
        meta: { target: ["email"] },
      },
    );

    errorHandler(errorObject, req, res, next);

    expect(failureSpy).toHaveBeenCalledWith(res, "email is already taken", 409);
  });

  it("returns 404 for the record that doesn't exist", () => {
    const failureSpy = vi.spyOn(response, "failure");
    const errorObject = new Prisma.PrismaClientKnownRequestError(
      "Record not found",
      {
        code: "P2025",
        clientVersion: "4.15.0",
      },
    );

    errorHandler(errorObject, req, res, next);

    expect(failureSpy).toHaveBeenCalledWith(res, "Record not found", 404);
  });

  it("returns 500 for all other errors", () => {
    const failureSpy = vi.spyOn(response, "failure");
    const errorObject = new Error("some other errors");

    errorHandler(errorObject, req, res, next);

    expect(failureSpy).toHaveBeenCalledWith(res, "Internal Server Error", 500);
  });
});
