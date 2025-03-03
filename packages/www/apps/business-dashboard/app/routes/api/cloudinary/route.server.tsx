import { type ActionFunctionArgs } from "react-router";
import { type Logger } from "~/logging/index.js";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server.js";
import { getProfilePictureSignature } from "./actions/get-profile-picture-signature.server.js";
import { getTeamLogoSignature } from "./actions/get-team-logo-signature.server.js";
import { CloudinaryIntent } from "./intents.js";

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);

    if (intent === CloudinaryIntent.GET_PROFILE_PICTURE_SIGNATURE)
      return await getProfilePictureSignature(args, logger);
    if (intent === CloudinaryIntent.GET_SELLER_TEAM_LOGO_SIGNATURE)
      return await getTeamLogoSignature(args, logger);
  },
);
