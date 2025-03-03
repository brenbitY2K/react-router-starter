import { getPublicConfig, type SubscriptionPlan } from "~/public-config";

const config = getPublicConfig();

export function getDefaultMapStyle() {
  return config.aws.maps["EsriNavigation"] as MapStyle;
}

export type StripeSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "paused";

export type SubscriptionInfo = {
  plan: SubscriptionPlan;
  status: StripeSubscriptionStatus;
};

export const planLevels = {
  contractor: 1,
  acquisition: 2,
  rezoning: 3,
} as const;

export type MapStyle = (typeof config.aws.maps)[keyof typeof config.aws.maps];
