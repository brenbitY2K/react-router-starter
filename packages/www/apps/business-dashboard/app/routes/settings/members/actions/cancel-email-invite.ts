import { data, type ActionFunctionArgs } from "react-router";
import { loggerWithNamedActionInfo, type Logger } from "~/logging/index.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { TeamRepository } from "~/repositories/teams.server.js";
import { teams, customers } from "@acme/database/schema";
import { validateTeamFromSlug } from "~/utils/team/actions.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { TeamMemberService } from "~/services/team-members.server.js";
import { SettingsMemberRouteIntent } from "../members-route.js";
import { z } from "zod";
import { validateFormData } from "~/utils/actions.server.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";
import { validateCustomerHasRole } from "~/utils/permissions/actions.server.js";

export const cancelEmailInviteSchema = z.object({
  code: z
    .string()
    .min(1, "Please provide them invite code you want to cancel."),
});

export async function cancelEmailInvite(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    SettingsMemberRouteIntent.CANCEL_EMAIL_INVITE,
  );

  const customer = await validateCustomer({
    args,
    logger,
    projection: { id: customers.id },
  });
  const teamSlug = requireTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const formData = await args.request.formData();

  const parsed = await validateFormData({
    schema: cancelEmailInviteSchema,
    formData,
  });

  if (!parsed.success) {
    throw throwActionErrorAndLog({
      message: "An unknown error occured. Please try again later",
      logInfo: { logger, event: "unknown" },
    });
  }

  const team = await validateTeamFromSlug({
    teamSlug,
    logger,
    projection: { id: teams.id },
  });

  await validateCustomerHasRole({
    customerId: customer.id,
    teamId: team.id,
    role: "admin",
    logger,
    errorMessage: "You don't have permission to cancel invites.",
  });

  const teamRepo = new TeamRepository();

  const teamMemberService = new TeamMemberService({
    teamRepo,
    logger,
  });

  await teamMemberService.cancelEmailInvite({
    teamId: team.id,
    code: parsed.data.code.trim(),
  });

  return data(null, { status: 200 });
}
