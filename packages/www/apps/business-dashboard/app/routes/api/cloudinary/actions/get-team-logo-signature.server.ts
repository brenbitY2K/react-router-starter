import { type ActionFunctionArgs } from "react-router";
import { type Logger, loggerWithNamedActionInfo } from "~/logging/index.js";
import { CloudinaryIntent } from "../intents.js";
import { cloudinary } from "~/lib/cloudinary.server.js";
import { serverConfig } from "~/config.server.js";
import { customers, teams } from "@acme/database/schema";
import { requireCustomerWithRole } from "~/utils/permissions/loaders.server.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { validateTeamFromSlug } from "~/utils/team/actions.js";
import { z } from "zod";
import { validateFormData } from "~/utils/actions.server.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";

const getTeamLogoSignatureSchema = z.object({
  teamSlug: z.string().min(1, { message: "Team slug is required." }),
});

export async function getTeamLogoSignature(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    CloudinaryIntent.GET_SELLER_TEAM_LOGO_SIGNATURE,
  );
  const parsed = await validateFormData({
    request: args.request,
    schema: getTeamLogoSignatureSchema,
  });

  if (!parsed.success) {
    throw throwActionErrorAndLog({
      message: "An unknown error occured. Please try again later.",
      logInfo: { logger, event: "form_validation_action_error" },
    });
  }

  const customer = await validateCustomer({
    args,
    logger,
    projection: { userId: customers.userId, id: customers.id },
  });

  const team = await validateTeamFromSlug({
    teamSlug: parsed.data.teamSlug,
    logger,
    projection: { id: teams.id },
  });

  await requireCustomerWithRole({
    customerId: customer.id,
    teamId: team.id,
    role: "admin",
    logger,
    errorMessage: "You don't have permission to change the team logo",
  });

  const timestamp = new Date().getTime();
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: "customer_team_logos",
      public_id: team.id,
      transformation: "f_webp",
    },
    serverConfig.cloudinaryApiSecret,
  ) as string;

  return { timestamp, signature };
}
