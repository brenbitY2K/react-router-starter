import {
  checkIfTeamHasSubscriptionOrThrow,
  checkIfTeamHasSubscriptionPlanOrThrow,
} from "./core.server.js";
import { throwActionErrorAndLog } from "../response.server.js";
import { type Logger } from "~/logging/index.js";
import { SubscriptionQuerier } from "~/repositories/subscriptions.server.js";
import { type SubscriptionSelectFields } from "~/repositories/teams.server.js";
import { type SubscriptionPlan } from "~/public-config.js";

export async function validateTeamHasSubscriptionPlan<
  P extends Partial<SubscriptionSelectFields>,
>({
  plan,
  logger,
  teamId,
  projection,
  errorMessage,
}: {
  plan: SubscriptionPlan;
  projection: P;
  teamId: string;
  logger: Logger;
  errorMessage: string;
}) {
  const subscriptionQuerier = new SubscriptionQuerier();

  return await checkIfTeamHasSubscriptionPlanOrThrow({
    subscriptionQuerier,
    teamId,
    plan,
    projection,
    thrower: () => {
      throw throwActionErrorAndLog({
        message: errorMessage,
        logInfo: { logger, event: "invalid_subscription_plan" },
      });
    },
  });
}

export async function validateTeamHasSubscription<
  P extends Partial<SubscriptionSelectFields>,
>({
  logger,
  teamId,
  projection,
  errorMessage,
}: {
  teamId: string;
  logger: Logger;
  projection: P;
  errorMessage: string;
}) {
  const subscriptionQuerier = new SubscriptionQuerier();

  return await checkIfTeamHasSubscriptionOrThrow({
    subscriptionQuerier,
    teamId,
    projection,
    thrower: () => {
      throw throwActionErrorAndLog({
        message: errorMessage,
        logInfo: { logger, event: "invalid_subscription_plan" },
      });
    },
  });
}
