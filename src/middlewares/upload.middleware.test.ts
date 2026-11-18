import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import response from "../utils/response";
import { errorHandler } from "./error.middleware";
import {
  IMAGE_TOO_LARGE_MESSAGE,
  INVALID_UPLOAD_MESSAGE,
  MAX_IMAGE_UPLOAD_BYTES,
  UNSUPPORTED_IMAGE_TYPE_MESSAGE,
  upload,
} from "./upload.middleware";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
const GIF = Buffer.from("GIF89a", "ascii");
const WEBP = Buffer.concat([
  Buffer.from("RIFF", "ascii"),
  Buffer.alloc(4),
  Buffer.from("WEBP", "ascii"),
]);

function createApp() {
  const app = express();

  app.post("/upload", upload.single("file"), (req, res) => {
    response.success(
      res,
      {
        field: req.file?.fieldname ?? null,
        mimetype: req.file?.mimetype ?? null,
        size: req.file?.size ?? null,
      },
      201,
      "File accepted",
    );
  });

  app.post("/upload-fails", upload.single("file"), (_req, _res, next) => {
    next(new Error("Cloudinary upload failed: invalid api_secret"));
  });

  app.use(errorHandler);
  return app;
}

function expectFailureEnvelope(
  body: { success: boolean; message: string; data: null },
  message: string,
) {
  expect(body).toEqual({ success: false, message, data: null });
  expect(JSON.stringify(body)).not.toMatch(/stack|MulterError|at \//);
}

describe("upload middleware", () => {
  const app = createApp();

  it("accepts an allowed image on the file field", async () => {
    const res = await request(app)
      .post("/upload")
      .attach("file", PNG, { filename: "pixel.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      message: "File accepted",
      data: {
        field: "file",
        mimetype: "image/png",
        size: PNG.length,
      },
    });
  });

  it("accepts JPEG, GIF, and WebP from their file headers", async () => {
    const jpeg = await request(app).post("/upload").attach("file", JPEG, {
      filename: "photo.jpg",
      contentType: "image/jpg",
    });
    const gif = await request(app).post("/upload").attach("file", GIF, {
      filename: "anim.gif",
      contentType: "image/gif",
    });
    const webp = await request(app).post("/upload").attach("file", WEBP, {
      filename: "cover.webp",
      contentType: "image/webp",
    });

    expect(jpeg.status).toBe(201);
    expect(jpeg.body.data.mimetype).toBe("image/jpeg");
    expect(gif.status).toBe(201);
    expect(gif.body.data.mimetype).toBe("image/gif");
    expect(webp.status).toBe(201);
    expect(webp.body.data.mimetype).toBe("image/webp");
  });

  it("rejects a non-image payload labelled image/png", async () => {
    const res = await request(app)
      .post("/upload")
      .attach("file", Buffer.from("%PDF-1.4"), {
        filename: "notes.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expectFailureEnvelope(res.body, UNSUPPORTED_IMAGE_TYPE_MESSAGE);
  });

  it("rejects SVG instead of storing unsanitized markup", async () => {
    const declared = await request(app)
      .post("/upload")
      .attach(
        "file",
        Buffer.from(
          "<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>",
        ),
        { filename: "logo.svg", contentType: "image/svg+xml" },
      );
    const disguised = await request(app)
      .post("/upload")
      .attach(
        "file",
        Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"),
        { filename: "logo.png", contentType: "image/png" },
      );

    expect(declared.status).toBe(400);
    expectFailureEnvelope(declared.body, UNSUPPORTED_IMAGE_TYPE_MESSAGE);
    expect(disguised.status).toBe(400);
    expectFailureEnvelope(disguised.body, UNSUPPORTED_IMAGE_TYPE_MESSAGE);
  });

  it("accepts a real image at the exact size limit", async () => {
    const cover = Buffer.alloc(MAX_IMAGE_UPLOAD_BYTES);
    PNG.copy(cover);

    const res = await request(app).post("/upload").attach("file", cover, {
      filename: "cover.png",
      contentType: "image/png",
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      field: "file",
      mimetype: "image/png",
      size: MAX_IMAGE_UPLOAD_BYTES,
    });
  });

  it("returns 400 for an unsupported file type", async () => {
    const res = await request(app)
      .post("/upload")
      .attach("file", Buffer.from("%PDF-1.4"), {
        filename: "notes.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(400);
    expectFailureEnvelope(res.body, UNSUPPORTED_IMAGE_TYPE_MESSAGE);
  });

  it("returns 413 when the file is larger than 5 MB", async () => {
    const res = await request(app)
      .post("/upload")
      .attach("file", Buffer.alloc(MAX_IMAGE_UPLOAD_BYTES + 1), {
        filename: "huge.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(413);
    expectFailureEnvelope(res.body, IMAGE_TOO_LARGE_MESSAGE);
  });

  it("returns 400 when the image is sent on an unexpected field", async () => {
    const res = await request(app)
      .post("/upload")
      .attach("logo", PNG, { filename: "pixel.png", contentType: "image/png" });

    expect(res.status).toBe(400);
    expectFailureEnvelope(res.body, INVALID_UPLOAD_MESSAGE);
  });

  it("leaves a missing file for the controller to reject", async () => {
    const res = await request(app).post("/upload").field("name", "Ada");

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      message: "File accepted",
      data: { field: null, mimetype: null, size: null },
    });
  });

  it("keeps a Cloudinary failure as a 500 without the provider message", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app).post("/upload-fails").attach("file", PNG, {
      filename: "pixel.png",
      contentType: "image/png",
    });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: "Internal Server Error",
      data: null,
    });
    expect(JSON.stringify(res.body)).not.toContain("api_secret");
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
