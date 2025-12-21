import { useMutation } from "@tanstack/react-query";
import { uploadToCloudinary } from "@/services/cloudinary.service";
import { CloudinaryUploadResult } from "@/services/cloudinary.service";

type UploadPayload = {
  file: File;
  folder?: string;
};

export const useCloudinaryUpload = () =>
  useMutation<CloudinaryUploadResult, Error, UploadPayload>({
    mutationFn: ({ file, folder }) =>
      uploadToCloudinary(file, folder),
  });
