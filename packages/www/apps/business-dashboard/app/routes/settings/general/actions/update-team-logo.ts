import { data, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { type Logger, loggerWithNamedActionInfo } from "~/logging/index.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { validateFormData } from "~/utils/actions.server.js";
import { customers, teams } from "@acme/database/schema";
import { throwActionErrorAndLog } from "~/utils/response.server.js";
import { TeamService } from "~/services/team.server.js";
import { TeamRepository } from "~/repositories/teams.server.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { requireTeamFromSlug } from "~/utils/team/loaders.js";
import { requireCustomerWithRole } from "~/utils/permissions/loaders.server.js";
import { SettingsGeneralRouteIntent } from "../general-route.js";

const updateTeamLogoSchema = z.object({
  imageUrl: z.string().min(1, "Please provide a image url").optional(),
});

export async function updateTeamLogo(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    SettingsGeneralRouteIntent.UPDATE_LOGO,
  );

  const customer = await validateCustomer({
    args,
    logger,
    projection: { id: customers.id, userId: customers.userId },
  });

  const teamSlug = requireTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const team = await requireTeamFromSlug({
    teamSlug,
    logger,
    projection: { id: teams.id },
  });

  await requireCustomerWithRole({
    logger,
    teamId: team.id,
    customerId: customer.id,
    role: "admin",
    errorMessage: "You do not have permission to update this team's logo",
  });

  const formData = await args.request.formData();

  const parsed = await validateFormData({
    schema: updateTeamLogoSchema,
    formData,
  });

  if (!parsed.success) {
    throw throwActionErrorAndLog({
      message:
        "We weren't able to update your team logo. Please try again later.",
      logInfo: { logger, event: "form_validation_action_error" },
    });
  }

  const teamService = new TeamService({
    logger,
    teamRepo: new TeamRepository(),
  });

  await teamService.updateGeneralInfo({
    teamId: team.id,
    imageUrl: parsed.data.imageUrl,
  });

  return data({
    success: true,
  });
}
