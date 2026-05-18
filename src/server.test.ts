import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listenMock: vi.fn(),
  warnMock: vi.spyOn(console, "warn").mockImplementation(() => {}),
  logMock: vi.spyOn(console, "log").mockImplementation(() => {}),
}));

vi.mock("./app", () => ({
  default: {
    listen: mocks.listenMock,
  },
}));

vi.mock("./config/env", () => ({
  env: {
    port: 3000,
    adminApiKey: "",
  },
}));

beforeEach(() => {
  mocks.listenMock.mockReset();
  mocks.warnMock.mockClear();
  mocks.logMock.mockClear();
  vi.resetModules();
});

describe("server startup", () => {
  it("warns when ADMIN_API_KEY is missing", async () => {
    await import("./server");

    expect(mocks.warnMock).toHaveBeenCalledWith(
      "WARNING: ADMIN_API_KEY is not set. All admin endpoints will return 500.",
    );
    expect(mocks.listenMock).toHaveBeenCalledWith(3000, expect.any(Function));
  });
});
