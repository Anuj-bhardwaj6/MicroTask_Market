import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";

// Streams an in-memory file buffer to Cloudinary without touching disk.
export function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

export function deleteFromCloudinary(publicId, resourceType = "auto") {
  if (!publicId) return Promise.resolve(null);
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export default { uploadBufferToCloudinary, deleteFromCloudinary };
