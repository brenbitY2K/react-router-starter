import { EventEnum, MetricEnum, ProfileEnum } from "klaviyo-api";
import { eventsApi } from "~/lib/klaviyo.server";
import { type KlaviyoEvent } from "./types";

export async function createKlaviyoServerEvent<T extends KlaviyoEvent>({
  eventName,
  eventProperties,
  profileAttributes,
  value,
}: {
  eventName: T["name"];
  eventProperties: T["eventProperties"];
  profileAttributes: T["profileAttributes"];
  value?: number;
}) {
  try {
    const response = await eventsApi.createEvent({
      data: {
        type: EventEnum.Event,
        attributes: {
          value,
          profile: {
            data: {
              type: ProfileEnum.Profile,
              attributes: {
                email: profileAttributes.email,
                externalId: profileAttributes.id,
                properties: {
                  ...Object.fromEntries(
                    Object.entries(profileAttributes).filter(
                      ([key]) => !["email", "id"].includes(key),
                    ),
                  ),
                },
              },
            },
          },
          metric: {
            data: {
              type: MetricEnum.Metric,
              attributes: {
                name: eventName,
              },
            },
          },
          properties: {
            ...eventProperties,
            timestamp: new Date().toISOString(),
          },
        },
      },
    });

    return response.body;
  } catch (error) {
    if (isKlaviyoError(error)) {
      console.error("HTTP Status:", error.response?.status);
      console.error("Status Text:", error.response?.statusText);
      console.error("Error Response:", error.response?.data);
    } else {
      console.error("Unexpected error:", error);
    }
  }
}

interface KlaviyoErrorResponse {
  response?: {
    status?: number;
    statusText?: string;
    data?: unknown;
  };
}

function isKlaviyoError(error: unknown): error is KlaviyoErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as KlaviyoErrorResponse).response === "object"
  );
}
