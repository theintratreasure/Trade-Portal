export type CloudinaryUploadResult = {
  image_url: string;
  image_public_id: string;
};

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export async function uploadToCloudinary(
  file: File,
  folder = "kyc"
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error("Cloudinary Error:", data);
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }

  return {
    image_url: data.secure_url,
    image_public_id: data.public_id,
  };
}
