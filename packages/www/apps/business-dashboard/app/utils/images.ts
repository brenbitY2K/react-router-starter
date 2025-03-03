import { type UploadApiResponse } from "cloudinary";
import { getPublicConfig } from "~/public-config";

const config = getPublicConfig();

export const MAX_PROFILE_PICTURE_FILE_SIZE = 2 * 1024 * 1024; // 2 MB limit
export const MAX_PROFILE_PICTURE_FILE_SIZE_ERROR_MESSAGE =
  "Profile pictures can only be up to 2mb in size.";

export const MAX_TEAM_LOGO_FILE_SIZE = 1 * 1024 * 1024; // 1 MB limit
export const MAX_TEAM_LOGO_FILE_SIZE_ERROR_MESSAGE =
  "Team logos can only be up to 1mb in size.";

export async function uploadImageToCloudinaryWithPresignedUrl(
  formData: FormData,
  {
    timestamp,
    signature,
  }: {
    timestamp: number;
    signature: string;
  },
) {
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload?api_key=${config.cloudinaryApiKey}&timestamp=${timestamp}&signature=${signature}`,
    {
      method: "POST",
      body: formData,
    },
  );
  const data = await res.json();

  return data as UploadApiResponse;
}

export function generateImageFallbackText(value: string) {
  if (!value) {
    return "";
  }

  const words = value.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].charAt(0);
  }

  return words[0].charAt(0) + words[1].charAt(0);
}
