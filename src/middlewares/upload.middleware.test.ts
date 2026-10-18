import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { upload } from "./upload.middleware";

const app = express();

app.post("/test-upload", upload.single("image"), (_req, res) => {
  res.status(200).json({ message: "Upload successful" });
});

app.use(
  (
    err: Error & { code?: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File size limit exceeded" });
    }
    return res.status(500).json({ error: err.message });
  },
);

describe("upload middleware size limits", () => {
  it("allows image uploads around ~1 MB", async () => {
    const oneMbBuffer = Buffer.alloc(1024 * 1024);
    const res = await request(app)
      .post("/test-upload")
      .attach("image", oneMbBuffer, {
        filename: "test-1mb.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Upload successful");
  });

  it("rejects image uploads greater than 5 MB", async () => {
    const sixMbBuffer = Buffer.alloc(6 * 1024 * 1024);

    const res = await request(app)
      .post("/test-upload")
      .attach("image", sixMbBuffer, {
        filename: "test-6mb.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("File size limit exceeded");
  });
});
