import { config as devConfig } from "./config.development.js";
import { config as stagingConfig } from "./config.staging.js";
import { config as prodConfig } from "./config.production.js";

// Don't import directly from this file in the client.
// It is used in the root loader and all values are then
// accessed through the window namespace.
const getConfig_SERVER_RUNTIME_ONLY = () => {
  switch (process.env.NODE_ENV) {
    case "development":
      return devConfig;
    case "production":
      if (process.env.STAGE === "staging") {
        return stagingConfig;
      }
      return prodConfig;
    default:
      return devConfig;
  }
};

export const clientConfig_SERVER_RUNTIME_ONLY =
  getConfig_SERVER_RUNTIME_ONLY() as typeof prodConfig;

declare global {
  interface Window {
    config: typeof clientConfig_SERVER_RUNTIME_ONLY;
  }
}

export function getPublicConfig() {
  if (typeof window !== "undefined" && !window.config) {
    throw new Error(
      `Missing the window.config component at the root of your app.`,
    );
  }

  return typeof window === "undefined"
    ? clientConfig_SERVER_RUNTIME_ONLY
    : window.config;
}

export type SubscriptionPlan =
  keyof typeof clientConfig_SERVER_RUNTIME_ONLY.stripe.products;
