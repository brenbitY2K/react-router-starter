import type { Route } from "./+types/billing-route";
import { customers, subscriptions, teams } from "@acme/database/schema";
import {
  Outlet,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { requireCustomer } from "~/utils/auth/loaders.server.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server";
import { createCheckoutSession } from "./actions/create-checkout-session";
import { type Logger } from "~/logging";
import { useActionErrorToast } from "~/hooks/action";
import { requireCustomerWithRole } from "~/utils/permissions/loaders.server";
import { requireTeamFromSlug } from "~/utils/team/loaders";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server";
import { TeamQuerier } from "~/repositories/teams.server";
import { createPortalSession } from "./actions/create-portal-session";
import { getProductSlugFromId } from "~/utils/stripe.server";
import { UnsubscribedView } from "./components/unsubscribed-view";
import { SubscribedView } from "./components/subscribed-view";
import { useGA4TeamSlugPageView } from "~/hooks/analytics-tracking";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);
  const customer = await requireCustomer({
    args,
    logger,
    projection: {
      id: customers.id,
      hasUsedTrial: customers.hasUsedTrial,
      userId: customers.userId,
    },
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
    customerId: customer.id,
    teamId: team.id,
    role: "owner",
    logger,
    errorMessage: "You don't have permission to view billing information",
  });

  const teamQuerier = new TeamQuerier();

  const subscription = await teamQuerier.querySubscription({
    teamId: team.id,
    projection: {
      status: subscriptions.status,
      productId: subscriptions.productId,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      billingInterval: subscriptions.billingInterval,
      currentPeriodSeats: subscriptions.currentPeriodSeats,
    },
  });

  const subscriptionData =
    subscription !== undefined
      ? {
          status: subscription.status,
          plan: getProductSlugFromId(subscription.productId),
          nextBillingDate: subscription.currentPeriodEnd,
          billingInterval: subscription.billingInterval,
          seats: subscription.currentPeriodSeats,
        }
      : null;

  return {
    userId: customer.userId,
    teamId: team.id,
    subscription: subscriptionData,
    hasCustomerUsedFreeTrial: customer.hasUsedTrial ?? false,
  };
};

export enum BillingRouteIntent {
  CREATE_CHECKOUT_SESSION = "billing_route_intent_create_checkout_session",
  CREATE_PORTAL_SESSION = "billing_route_intent_create_portal_session",
}

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);

    if (intent === BillingRouteIntent.CREATE_CHECKOUT_SESSION) {
      return await createCheckoutSession(args, logger);
    }
    if (intent === BillingRouteIntent.CREATE_PORTAL_SESSION) {
      return await createPortalSession(args, logger);
    }
  },
);

export default function BillingRoute({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  useActionErrorToast(actionData);

  useGA4TeamSlugPageView({ teamSlug: params.teamSlug });

  return (
    <div className="container mx-auto px-16 py-16">
      {loaderData.subscription != null &&
      loaderData.subscription?.status !== "canceled" ? (
        <SubscribedView subscription={loaderData.subscription} />
      ) : (
        <UnsubscribedView
          hasCustomerUsedFreeTrial={loaderData.hasCustomerUsedFreeTrial}
          userId={loaderData.userId}
          teamId={loaderData.teamId}
        />
      )}
      <Outlet />
    </div>
  );
}
