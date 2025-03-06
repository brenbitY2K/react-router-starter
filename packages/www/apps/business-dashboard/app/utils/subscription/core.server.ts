import { subscriptions } from "@acme/database/schema";
import { type SubscriptionPlan } from "~/public-config";
import { type SubscriptionQuerier } from "~/repositories/subscriptions.server";
import { type Thrower } from "~/types/errors.js";
import { getProductSlugFromId } from "../stripe.server";
import { type SubscriptionSelectFields } from "~/repositories/teams.server";

const planHierarchy: Record<SubscriptionPlan, SubscriptionPlan[]> = {
  contractor: ["contractor"],
  acquisition: ["contractor", "acquisition"],
  rezoning: ["contractor", "acquisition", "rezoning"],
} as const;

export async function checkIfTeamHasSubscriptionPlanOrThrow<
  P extends Partial<SubscriptionSelectFields>,
>({
  plan,
  subscriptionQuerier,
  teamId,
  projection,
  thrower,
}: {
  plan: SubscriptionPlan;
  subscriptionQuerier: SubscriptionQuerier;
  projection: P;
  teamId: string;
  thrower: Thrower;
}) {
  const subscription = await subscriptionQuerier.querySubscription({
    teamId,
    projection,
  });

  if (!subscription || subscription.status !== "active") throw thrower();

  let activePlan: SubscriptionPlan;
  try {
    activePlan = getProductSlugFromId(subscription.productId);
  } catch {
    throw thrower();
  }

  const hasAccess = planHierarchy[activePlan].includes(plan);
  if (!hasAccess) throw thrower();

  return subscription;
}

export async function checkIfTeamHasSubscriptionOrThrow<
  P extends Partial<SubscriptionSelectFields>,
>({
  subscriptionQuerier,
  teamId,
  projection,
  thrower,
}: {
  subscriptionQuerier: SubscriptionQuerier;
  teamId: string;
  projection: P;
  thrower: Thrower;
}) {
  const subscription = await subscriptionQuerier.querySubscription({
    teamId,
    projection: { ...projection, status: subscriptions.status },
  });

  if (
    !subscription ||
    (subscription.status !== "active" && subscription.status !== "trialing")
  )
    throw thrower();

  return subscription;
}
