import { data, type ActionFunctionArgs } from "react-router";
import { loggerWithNamedActionInfo, type Logger } from "~/logging/index.js";
import { TeamRepository } from "~/repositories/teams.server.js";
import { teams, customers, subscriptions } from "@acme/database/schema";
import { validateTeamFromSlug } from "~/utils/team/actions.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { TeamMemberService } from "~/services/team-members.server.js";
import { SettingsMemberRouteIntent } from "../members-route.js";
import { validateCustomerHasRole } from "~/utils/permissions/actions.server.js";
import { validateTeamSlugRouteParam } from "~/utils/url/actions.server.js";
import { validateFormData } from "~/utils/actions.server.js";
import { validateTeamHasSubscription } from "~/utils/subscription/actions.server";
import { z } from "zod";
import { throwActionErrorAndLog } from "~/utils/response.server.js";

export const toggleInviteLinkSchema = z.object({
  inviteLinkToggle: z.enum(["on", "off"], {
    message: "Toggle must be either 'on' or 'off'",
  }),
});

export async function toggleInviteLink(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    SettingsMemberRouteIntent.TOGGLE_INVITE_LINK,
  );
  const customer = await validateCustomer({
    args,
    logger,
    projection: { id: customers.id },
  });

  const teamSlug = validateTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const formData = await args.request.formData();

  const parsed = await validateFormData({
    schema: toggleInviteLinkSchema,
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

  await validateTeamHasSubscription({
    teamId: team.id,
    projection: {
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      subscriptionItemId: subscriptions.subscriptionItemId,
      currentPeriodSeats: subscriptions.currentPeriodSeats,
    },
    errorMessage:
      "You must have an active subscription to invite members to your team.",
    logger,
  });

  await validateCustomerHasRole({
    customerId: customer.id,
    teamId: team.id,
    role: "admin",
    logger,
    errorMessage: "You don't have permission to toggle the invite link",
  });

  const teamRepo = new TeamRepository();

  const teamMemberService = new TeamMemberService({
    logger,
    teamRepo,
  });

  await teamMemberService.toggleInviteLink({
    teamId: team.id,
    newStatus: parsed.data.inviteLinkToggle,
  });

  return data(null, { status: 200 });
}
