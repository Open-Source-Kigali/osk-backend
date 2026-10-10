import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const uploaderMock = vi.hoisted(() => ({
  upload_stream: vi.fn(),
  destroy: vi.fn(),
}));

vi.mock("../config/cloudinary", () => ({
  cloudinary: { uploader: uploaderMock },
}));

import cloudinaryService from "./cloudinary.service";

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CloudinaryService", () => {
  describe("uploadBuffer", () => {
    it("resolves with secure_url and public_id on success", async () => {
      const buffer = Buffer.from("image-bytes");
      uploaderMock.upload_stream.mockImplementation(
        (
          _options: unknown,
          callback: (err: unknown, result: unknown) => void,
        ) =>
          ({
            end: vi.fn(() =>
              callback(null, {
                secure_url:
                  "https://res.cloudinary.com/demo/image/upload/x.jpg",
                public_id: "events/x",
              }),
            ),
          }) as unknown as ReturnType<typeof uploaderMock.upload_stream>,
      );

      const result = await cloudinaryService.uploadBuffer(buffer, "events");

      expect(result).toEqual({
        secure_url: "https://res.cloudinary.com/demo/image/upload/x.jpg",
        public_id: "events/x",
      });
      expect(uploaderMock.upload_stream).toHaveBeenCalledWith(
        { folder: "events", resource_type: "image" },
        expect.any(Function),
      );
    });

    it("rejects when the upload fails", async () => {
      const buffer = Buffer.from("image-bytes");
      const error = new Error("upload failed");
      uploaderMock.upload_stream.mockImplementation(
        (_options: unknown, callback: (err: unknown) => void) =>
          ({
            end: vi.fn(() => callback(error)),
          }) as unknown as ReturnType<typeof uploaderMock.upload_stream>,
      );

      await expect(
        cloudinaryService.uploadBuffer(buffer, "events"),
      ).rejects.toThrow("upload failed");
    });
  });

  describe("destroyImage", () => {
    it("destroys the image by public id", async () => {
      uploaderMock.destroy.mockResolvedValue({ result: "ok" });

      await cloudinaryService.destroyImage("events/x");

      expect(uploaderMock.destroy).toHaveBeenCalledWith("events/x");
    });

    it("swallows errors so a failed delete never rejects", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      uploaderMock.destroy.mockRejectedValue(new Error("network down"));

      await expect(
        cloudinaryService.destroyImage("events/x"),
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to destroy Cloudinary image",
        "events/x",
        expect.any(Error),
      );
    });
  });
});
