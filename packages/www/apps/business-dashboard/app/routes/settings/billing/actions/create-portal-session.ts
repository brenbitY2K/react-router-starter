import { customers, teams } from "@acme/database/schema";
import { type ActionFunctionArgs, redirect } from "react-router";
import { type Logger } from "~/logging";
import { CustomerRepository } from "~/repositories/customers.server";
import { SubscriptionRepository } from "~/repositories/subscriptions.server";
import { TeamRepository } from "~/repositories/teams.server";
import { SubscriptionService } from "~/services/subscription.server";
import { validateCustomer } from "~/utils/auth/actions.server";
import { validateCustomerHasRole } from "~/utils/permissions/actions.server";
import { throwActionErrorAndLog } from "~/utils/response.server";
import { validateTeamFromSlug } from "~/utils/team/actions";
import { validateTeamSlugRouteParam } from "~/utils/url/actions.server";

export async function createPortalSession(
  args: ActionFunctionArgs,
  logger: Logger,
) {
  const teamSlug = validateTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const team = await validateTeamFromSlug({
    teamSlug,
    logger,
    projection: { id: teams.id, stripeCustomerId: teams.stripeCustomerId },
  });

  const customer = await validateCustomer({
    args,
    logger,
    projection: { id: customers.id },
  });

  await validateCustomerHasRole({
    customerId: customer.id,
    teamId: team.id,
    role: "owner",
    logger,
    errorMessage: "You do not have permission to manage billing settings.",
  });

  if (!team.stripeCustomerId) {
    throw throwActionErrorAndLog({
      message: "You do not have a subscription.",
      logInfo: {
        logger,
        event: "stripe_checkout_session_creation_failed",
      },
    });
  }

  const subscriptionService = new SubscriptionService({
    teamRepo: new TeamRepository(),
    customerRepo: new CustomerRepository(),
    subscriptionRepo: new SubscriptionRepository(),
  });

  const portalUrl = await subscriptionService.createPortalSession({
    stripeCustomerId: team.stripeCustomerId,
    teamSlug,
  });

  return redirect(portalUrl);
}
