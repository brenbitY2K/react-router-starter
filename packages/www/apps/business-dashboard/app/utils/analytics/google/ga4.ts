import { getPublicConfig } from "~/public-config";
import { type GoogleEvent } from "./types";

const publicConfig = getPublicConfig();

export const GA_MEASUREMENT_ID =
  publicConfig.environment === "production"
    ? "G-JKHF7Z33KM"
    : publicConfig.environment === "staging"
      ? "G-8ZDDFZ6V4Q"
      : undefined;

export function checkIfEnvSupportsGA4() {
  return (
    publicConfig.environment === "production" ||
    publicConfig.environment === "staging"
  );
}

export const trackGA4Event = <T extends GoogleEvent>(
  eventName: T["name"],
  parameters: T["params"],
) => {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", eventName, parameters);
  }
};
