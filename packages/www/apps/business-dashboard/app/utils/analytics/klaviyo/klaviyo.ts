import { type KlaviyoEvent, type KlaviyoIdentifyProps } from "./types";

export const trackKlaviyoEvent = <T extends KlaviyoEvent>(
  eventName: T["name"],
  eventProperties: T["eventProperties"],
) => {
  if (typeof window !== "undefined" && window._learnq) {
    window._learnq.push(["track", eventName, eventProperties]);
  }
};

export const identifyKlaviyoUser = (
  email: string,
  properties: KlaviyoIdentifyProps,
) => {
  if (typeof window !== "undefined" && window._learnq) {
    window._learnq.push([
      "identify",
      {
        $email: email,
        ...properties,
      },
    ]);
  }
};
