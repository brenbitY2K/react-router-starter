import { v2 } from "cloudinary";
import { serverConfig } from "~/config.server.js";
import { getPublicConfig } from "~/public-config.js";

export const cloudinary = v2;

const publicConfig = getPublicConfig();

cloudinary.config({
  cloud_name: publicConfig.cloudinaryCloudName,
  api_key: publicConfig.cloudinaryApiKey,
  api_secret: serverConfig.cloudinaryApiSecret,
});
