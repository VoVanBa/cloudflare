import { MEDIA_ERRORS } from "../constants/errors";
import { createMany } from "../repositories/media.repository";
import { getCloudinaryConfig } from "../untils/cloudinary";

interface CloudinaryResponse {
  secure_url: string;
  [key: string]: any;
}

export const uploadMultipleImagesToCloudinary = async (
  files: File[],
  env: Env,
  folder?: string
) => {
  const { cloudName } = getCloudinaryConfig(env);

  const uploadedResults = await Promise.all(
    files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const base64String = Buffer.from(arrayBuffer).toString("base64");
      const dataUri = `data:${file.type};base64,${base64String}`;

      const formData = new FormData();
      formData.append("file", dataUri);
      formData.append("upload_preset", env.CLOUDINARY_UPLOAD_PRESET);
      if (folder) {
        formData.append("folder", folder);
      }

      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(
          `${MEDIA_ERRORS.UPLOAD_FAILED}: ${JSON.stringify(error)}`
        );
      }

      const result = (await res.json()) as CloudinaryResponse;

      return {
        cloudinary: result,
        file,
      };
    })
  );

  const filesData = uploadedResults.map(({ file, cloudinary }) => ({
    url: cloudinary.secure_url,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  }));

  // 👉 dùng createMany để lấy danh sách Media (có id)
  const medias = await createMany(env, filesData);

  return {
    mediaIds: medias.map((m) => m.id),
  };
};
