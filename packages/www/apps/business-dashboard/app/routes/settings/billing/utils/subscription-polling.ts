import { subscriptions } from "@acme/database/schema";
import { SubscriptionQuerier } from "~/repositories/subscriptions.server";
import {
  getPriceAmount,
  getProductIdFromPriceId,
  getProductSlugFromId,
} from "~/utils/stripe.server";

export async function pollSubscriptionStatus({
  teamId,
  attempts,
}: {
  teamId: string;
  attempts: number;
}) {
  if (attempts >= 3) {
    throw new Error("Subscription verification timed out");
  }

  const subscriptionQuerier = new SubscriptionQuerier();

  const subscription = await subscriptionQuerier.querySubscription({
    teamId,
    projection: {
      status: subscriptions.status,
      priceId: subscriptions.priceId,
    },
  });

  if (!subscription) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return pollSubscriptionStatus({ teamId, attempts: attempts + 1 });
  }

  if (subscription.status === "active" || subscription.status === "trialing") {
    return createClientSubscriptionInfo(subscription);
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));
  return pollSubscriptionStatus({ teamId, attempts: attempts + 1 });
}

function createClientSubscriptionInfo(
  subscription: Pick<typeof subscriptions.$inferSelect, "status" | "priceId">,
) {
  const plan = getProductSlugFromId(
    getProductIdFromPriceId(subscription.priceId),
  );
  const amount = getPriceAmount(plan, subscription.priceId);

  return {
    plan,
    amount,
    status: subscription.status,
    priceId: subscription.priceId,
  };
}
