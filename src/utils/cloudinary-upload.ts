import { cloudinary } from "../config/cloudinary";

type UploadResult = { secure_url: string; public_id: string };

export function uploadBuffer(
  buffer: Buffer,
  folder: string,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err || !result) return reject(err);
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

/**
 * Attempts to delete an image from Cloudinary by its public ID.
 * Failures are logged but not thrown to avoid blocking the main request flow.
 */
export async function destroyImage(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // Log the error so operators can detect orphan images or configuration issues
    console.error("Failed to destroy Cloudinary image", publicId, err);
  }
}
