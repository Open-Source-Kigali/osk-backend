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

export async function destroyImage(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // best-effort cleanup; ignore failures
  }
}
