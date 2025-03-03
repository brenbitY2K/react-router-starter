import { z } from "zod";
import { type Logger } from "~/logging/index.js";
import { redirect, type ActionFunctionArgs } from "react-router";
import {
  sendFormValidationErrorJson,
  validateFormData,
} from "~/utils/actions.server";
import {
  throwActionErrorAndLog,
  throwUnauthenticatedErrorResponseJsonAndLog,
} from "~/utils/response.server";
import { validateTeamSlugRouteParam } from "~/utils/url/actions.server";
import { validateTeamFromSlug } from "~/utils/team/actions";
import { customers, teams, users } from "@acme/database/schema";
import { validateCustomer } from "~/utils/auth/actions.server";
import { validateCustomerHasRole } from "~/utils/permissions/actions.server";
import { UserQuerier } from "~/repositories/users.server";
import { TeamRepository } from "~/repositories/teams.server";
import { SubscriptionService } from "~/services/subscription.server";
import { SubscriptionRepository } from "~/repositories/subscriptions.server";
import { getPublicConfig } from "~/public-config";
import { CustomerRepository } from "~/repositories/customers.server";

const config = getPublicConfig();

const createCheckoutSessionSchema = z.object({
  priceId: z.string(),
  planType: z.enum(["contractor", "acquisition", "rezoning"]),
  interval: z.enum(["month", "year"]),
});

export async function createCheckoutSession(
  args: ActionFunctionArgs,
  logger: Logger,
) {
  const formData = await args.request.formData();

  const parsed = await validateFormData({
    schema: createCheckoutSessionSchema,
    formData,
  });

  if (!parsed.success) {
    return sendFormValidationErrorJson(parsed);
  }

  const teamSlug = validateTeamSlugRouteParam({ params: args.params, logger });
  const team = await validateTeamFromSlug({
    teamSlug,
    logger,
    projection: {
      id: teams.id,
      name: teams.name,
      stripeCustomerId: teams.stripeCustomerId,
    },
  });

  const customer = await validateCustomer({
    args,
    projection: {
      id: customers.id,
      userId: customers.userId,
      hasUsedTrial: customers.hasUsedTrial,
    },
    logger,
  });

  const userQuerier = new UserQuerier();

  const user = await userQuerier.queryUser({
    userId: customer.userId,
    projection: { email: users.email, name: users.name },
  });

  // This shouldn't ever really happen, but crash if it does
  if (!user)
    throw throwUnauthenticatedErrorResponseJsonAndLog({
      data: {
        message:
          "We had trouble authenticating your account. Please try signing out and signing back in.",
      },
      logInfo: { logger, event: "user_with_no_connected_customer_account" },
      location: "root",
    });

  await validateCustomerHasRole({
    customerId: customer.id,
    teamId: team.id,
    role: "owner",
    logger,
    errorMessage: "You don't have permission to manage your team's billing.",
  });

  const { priceId, planType, interval } = parsed.data;

  const subscriptionService = new SubscriptionService({
    teamRepo: new TeamRepository(),
    subscriptionRepo: new SubscriptionRepository(),
    customerRepo: new CustomerRepository(),
  });

  const trialDays = customer.hasUsedTrial
    ? 0
    : planType === "rezoning"
      ? 0
      : config.stripe.trialDays;

  const redirectUrl = await subscriptionService.createCheckoutSession({
    stripeCustomerId: team.stripeCustomerId,
    team,
    user,
    priceId,
    teamSlug,
    planType,
    interval,
    trialDays,
  });

  if (!redirectUrl) {
    throw throwActionErrorAndLog({
      message: "We were unable to initiate checkout",
      logInfo: {
        logger,
        event: "stripe_checkout_session_creation_failed",
      },
    });
  }

  return redirect(redirectUrl);
}
