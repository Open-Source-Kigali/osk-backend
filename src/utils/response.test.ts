import { describe, it, expect, vi } from "vitest";
import response from "./response";

describe("response.success", () => {
  it("ends the response without a JSON body for 204 status", () => {
    const endMock = vi.fn();
    const jsonMock = vi.fn();
    const statusMock = vi.fn(() => ({ end: endMock, json: jsonMock }));

    const res = { status: statusMock } as any;

    response.success(res, null, 204, "Deleted successfully");

    expect(statusMock).toHaveBeenCalledWith(204);
    expect(endMock).toHaveBeenCalled();
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it("returns JSON for non-204 status", () => {
    const endMock = vi.fn();
    const jsonMock = vi.fn();
    const statusMock = vi.fn(() => ({ end: endMock, json: jsonMock }));

    const res = { status: statusMock } as any;

    response.success(res, { value: 1 }, 200, "OK");

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "OK",
      data: { value: 1 },
    });
    expect(endMock).not.toHaveBeenCalled();
  });
});
