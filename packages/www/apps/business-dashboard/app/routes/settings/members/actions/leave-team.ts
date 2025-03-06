import { redirect, type ActionFunctionArgs } from "react-router";
import { loggerWithNamedActionInfo, type Logger } from "~/logging/index.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { TeamRepository } from "~/repositories/teams.server.js";
import { teams, customers, subscriptions } from "@acme/database/schema";
import { validateTeamFromSlug } from "~/utils/team/actions.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { TeamMemberService } from "~/services/team-members.server.js";
import { SettingsMemberRouteIntent } from "../members-route.js";
import { SubscriptionService } from "~/services/subscription.server.js";
import {
  SubscriptionQuerier,
  SubscriptionRepository,
} from "~/repositories/subscriptions.server.js";
import { CustomerRepository } from "~/repositories/customers.server.js";

export async function leaveTeam(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    SettingsMemberRouteIntent.LEAVE_TEAM,
  );

  const viewerCustomer = await validateCustomer({
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

  const subscriptionQuerier = new SubscriptionQuerier();
  const subscription = await subscriptionQuerier.querySubscription({
    teamId: team.id,
    projection: {
      stripeSubscriptionId: subscriptions.stripeSubscriptionId,
      subscriptionItemId: subscriptions.subscriptionItemId,
      currentPeriodSeats: subscriptions.currentPeriodSeats,
    },
  });

  const teamRepo = new TeamRepository();

  const teamMemberService = new TeamMemberService({
    teamRepo,
    logger,
  });

  await teamMemberService.removeCustomer({
    teamId: team.id,
    customerId: viewerCustomer.id,
    subscription,
    subscriptionService: new SubscriptionService({
      teamRepo: new TeamRepository(),
      customerRepo: new CustomerRepository(),
      subscriptionRepo: new SubscriptionRepository(),
    }),
  });

  throw redirect("/flow-selector");
}
