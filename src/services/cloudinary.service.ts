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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
        signal: controller.signal,
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
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Image upload timed out due to slow network. Please retry.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
