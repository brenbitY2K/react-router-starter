import { data, type ActionFunctionArgs } from "react-router";
import { loggerWithNamedActionInfo, type Logger } from "~/logging/index.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { TeamRepository } from "~/repositories/teams.server.js";
import { teams, customers } from "@acme/database/schema";
import { validateTeamFromSlug } from "~/utils/team/actions.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { TeamMemberService } from "~/services/team-members.server.js";
import { SettingsMemberRouteIntent } from "../members-route.js";
import { validateCustomerHasRole } from "~/utils/permissions/actions.server.js";

export async function refreshInviteLink(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    SettingsMemberRouteIntent.REFRESH_INVITE_LINK,
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
    errorMessage: "You don't have permission to toggle the invite link",
  });

  const teamRepo = new TeamRepository();
  const teamMemberService = new TeamMemberService({
    logger,
    teamRepo,
  });

  await teamMemberService.refreshInviteLink({
    teamId: team.id,
  });

  return data(null, { status: 200 });
}
