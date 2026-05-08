/**
 * Cloudinary unsigned upload service.
 *
 * Uses the Upload API with an **unsigned upload preset** so the browser
 * can upload directly without exposing any secret keys.
 *
 * Required env vars (set in .env):
 *   VITE_CLOUDINARY_CLOUD_NAME   – your Cloudinary cloud name
 *   VITE_CLOUDINARY_UPLOAD_PRESET – an unsigned upload preset name
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "YOUR_CLOUD_NAME";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "YOUR_UPLOAD_PRESET";

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload an image file to Cloudinary via unsigned upload.
 *
 * @param file  The File/Blob selected by the user
 * @param folder  Optional Cloudinary folder to organise uploads (e.g. "mentor_images")
 * @returns The upload result containing `secure_url` (the permanent HTTPS URL)
 */
export async function uploadToCloudinary(
  file: File,
  folder = "mentor_images",
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  console.log(CLOUD_NAME);
  console.log(UPLOAD_PRESET);
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const response = await fetch(UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cloudinary upload failed (${response.status}): ${errorBody}`);
  }

  return response.json();
}
