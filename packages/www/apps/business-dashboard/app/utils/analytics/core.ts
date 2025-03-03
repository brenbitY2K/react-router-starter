import { trackGA4Event } from "./google/ga4";
import { identifyKlaviyoUser, trackKlaviyoEvent } from "./klaviyo/klaviyo.js";

export function trackCompletedWelcomeFlow({
  userId,
  email,
  jobRole,
}: {
  userId: string;
  email: string;
  jobRole: string;
}) {
  trackGA4Event("completed_welcome_flow", {
    user_id: userId,
    user_job_role: jobRole,
  });

  identifyKlaviyoUser(email, { JobRole: jobRole });
  trackKlaviyoEvent("Welcome Flow Completed", { UserJobRole: jobRole });
}

export function trackBeginCheckout({
  userId,
  teamId,
  priceInfo,
  planType,
}: {
  userId: string;
  teamId: string;
  priceInfo: { amount: number; id: string };
  planType: string;
}) {
  trackGA4Event("begin_checkout", {
    user_id: userId,
    team_id: teamId,
    currency: "USD",
    value: priceInfo.amount,
    items: [
      {
        item_id: priceInfo.id,
        item_name: planType.toLowerCase(),
        price: priceInfo.amount,
        quantity: 1,
      },
    ],
  });

  trackKlaviyoEvent("Checkout Started", {
    TotalPrice: priceInfo.amount,
    Currency: "USD",
    Items: [
      {
        PlanName: planType.toLowerCase(),
        Price: priceInfo.amount,
        Quantity: 1,
      },
    ],
  });
}

export function trackTrialStarted(
  subscription: { amount: number; priceId: string; plan: string },
  userData: { userId: string; teamId: string },
) {
  trackGA4Event("trial_started", {
    user_id: userData.userId,
    team_id: userData.teamId,
    currency: "USD",
    value: subscription.amount,
    items: [
      {
        item_id: subscription.priceId,
        item_name: subscription.plan,
        price: subscription.amount,
        quantity: 1,
      },
    ],
  });
}
