import { data, type ActionFunctionArgs } from "react-router";
import { loggerWithNamedActionInfo, type Logger } from "~/logging/index.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { TeamRepository } from "~/repositories/teams.server.js";
import { teams, customers, subscriptions } from "@acme/database/schema";
import { validateTeamFromSlug } from "~/utils/team/actions.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { TeamMemberService } from "~/services/team-members.server.js";
import { SettingsMemberRouteIntent } from "../members-route.js";
import { z } from "zod";
import { validateFormData } from "~/utils/actions.server.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";
import { validateCustomerHasRole } from "~/utils/permissions/actions.server.js";
import { SubscriptionService } from "~/services/subscription.server.js";
import {
  SubscriptionQuerier,
  SubscriptionRepository,
} from "~/repositories/subscriptions.server.js";
import { CustomerRepository } from "~/repositories/customers.server.js";

export const removeMemberSchema = z.object({
  customerId: z.string().min(1, "Please select a customer to remove."),
});

export async function removeMember(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    SettingsMemberRouteIntent.REMOVE_MEMBER,
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
    schema: removeMemberSchema,
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
    errorMessage: "You don't have permission to remove members.",
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
    customerId: parsed.data.customerId,
    subscription,
    subscriptionService: new SubscriptionService({
      teamRepo: new TeamRepository(),
      customerRepo: new CustomerRepository(),
      subscriptionRepo: new SubscriptionRepository(),
    }),
  });

  return data(null, { status: 200 });
}
