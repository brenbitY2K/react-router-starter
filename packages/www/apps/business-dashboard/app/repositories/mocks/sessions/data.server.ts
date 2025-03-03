import { type sessions } from "@acme/database/schema";
import { generateMockCuid } from "../utils.js";
import { authSessionExpirationTimeSpan } from "~/sessions/auth.server.js";

export function mockedSessionFullSelect(): typeof sessions.$inferSelect {
  return {
    id: generateMockCuid(),
    userId: generateMockCuid(),
    expiresAt: new Date(Date.now() + authSessionExpirationTimeSpan.seconds()),
    ip: "192.168.1.1",
    ipCity: "New York",
    ipCountryCode: "US",
    ipCountryName: "United States",
    ipRegionCode: "NY",
    ipRegionName: "New York",
    ipLatitude: "40.7128",
    ipLongitude: "-74.0060",
    userAgentOS: "Windows 10",
    userAgentBrowser: "Chrome",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function mockedMultipleSessions(
  count: number = 3,
): ReturnType<typeof mockedSessionFullSelect>[] {
  return Array.from({ length: count }, (_, index) => ({
    ...mockedSessionFullSelect(),
    id: generateMockCuid(),
    ip: `192.168.1.${index + 1}`,
  }));
}
