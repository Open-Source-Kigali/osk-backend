import { describe, expect, it, vi } from "vitest";
import type { Response } from "express";
import response from "./response";

describe("response.success", () => {
  it("ends the response without a body for 204 No Content", () => {
    const end = vi.fn();
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ end, json });
    const res = { status } as unknown as Response;

    response.success(res, null, 204, "Deleted successfully");

    expect(status).toHaveBeenCalledWith(204);
    expect(end).toHaveBeenCalledOnce();
    expect(json).not.toHaveBeenCalled();
  });

  it("sends the standard JSON payload for non-204 responses", () => {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;

    response.success(res, { id: "1" }, 200, "OK");

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: "OK",
      data: { id: "1" },
    });
  });
});
