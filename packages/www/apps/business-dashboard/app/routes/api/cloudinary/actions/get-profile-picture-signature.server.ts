import { type ActionFunctionArgs } from "react-router";
import { type Logger, loggerWithNamedActionInfo } from "~/logging/index.js";
import { CloudinaryIntent } from "../intents.js";
import { cloudinary } from "~/lib/cloudinary.server.js";
import { serverConfig } from "~/config.server.js";
import { customers } from "@acme/database/schema";
import { validateCustomer } from "~/utils/auth/actions.server.js";

export async function getProfilePictureSignature(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    CloudinaryIntent.GET_PROFILE_PICTURE_SIGNATURE,
  );

  const customer = await validateCustomer({
    args,
    logger,
    projection: { userId: customers.userId },
  });

  const timestamp = new Date().getTime();
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: "profile_pictures",
      public_id: customer.userId,
      transformation: "f_webp",
    },
    serverConfig.cloudinaryApiSecret,
  ) as string;

  return { timestamp, signature };
}
