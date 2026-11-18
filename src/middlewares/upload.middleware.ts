import type { RequestHandler } from "express";
import multer from "multer";

/**
 * Shared limit for every image upload (event covers, project images,
 * partner and organisation logos, review profile photos).
 * 5 MiB matches photos and logos those screens already accept.
 */
export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Labels accepted on the multipart `file` field. `image/jpg` is a JPEG alias.
 * SVG is intentionally absent: the stored object is the original upload, and
 * SVG can carry scripts and external references. This service does not
 * sanitize SVG, so those files are rejected instead of stored.
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const JPEG_MIME_ALIAS = "image/jpg";

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

export const UNSUPPORTED_IMAGE_TYPE_MESSAGE =
  "Unsupported file type. Allowed types: JPEG, PNG, WebP, and GIF.";

export const IMAGE_TOO_LARGE_MESSAGE = "Image must be 5 MB or smaller.";

export const INVALID_UPLOAD_MESSAGE =
  'Invalid file upload. Send one image in the "file" field.';

type RasterImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export class UploadValidationError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "UploadValidationError";
    this.statusCode = statusCode;
  }
}

function normalizeMimeType(mimeType: string) {
  return mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
}

function isAllowedImageLabel(mimeType: string) {
  const normalized = normalizeMimeType(mimeType);
  if (normalized === JPEG_MIME_ALIAS) return true;
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(normalized);
}

/**
 * Identifies JPEG, PNG, GIF, and WebP from the file header.
 * `file-type` is not a dependency: current releases are ESM-only, and this
 * package is CommonJS. These four signatures are stable and enough here.
 */
export function detectRasterImage(buffer: Buffer): RasterImageMimeType | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= PNG_SIGNATURE.length &&
    buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
  ) {
    return "image/png";
  }

  if (buffer.length >= 6) {
    const gif = buffer.subarray(0, 6).toString("ascii");
    if (gif === "GIF87a" || gif === "GIF89a") return "image/gif";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

const parser = multer({
  storage: multer.memoryStorage(),
  // Busboy emits "limit" when the buffered size reaches this value, so a file
  // of exactly MAX_IMAGE_UPLOAD_BYTES would be rejected. One extra byte keeps
  // the documented 5 MB maximum inclusive.
  limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES + 1 },
  fileFilter(_req, file, cb) {
    if (isAllowedImageLabel(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new UploadValidationError(UNSUPPORTED_IMAGE_TYPE_MESSAGE, 400));
  },
});

function single(fieldName: string): RequestHandler {
  const parse = parser.single(fieldName);

  return (req, res, next) => {
    parse(req, res, (err) => {
      if (err) {
        next(err);
        return;
      }

      if (!req.file) {
        next();
        return;
      }

      const detected = detectRasterImage(req.file.buffer);
      if (!detected) {
        next(new UploadValidationError(UNSUPPORTED_IMAGE_TYPE_MESSAGE, 400));
        return;
      }

      req.file.mimetype = detected;
      next();
    });
  };
}

export const upload = { single };
