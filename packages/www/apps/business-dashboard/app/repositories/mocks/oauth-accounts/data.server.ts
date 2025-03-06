import { type oauthAccounts } from "@acme/database/schema";
import { generateMockCuid } from "../utils.js";

export function mockedOAuthAccountFullSelect(): typeof oauthAccounts.$inferSelect {
  return {
    providerId: "google",
    providerUserId: generateMockCuid(),
    providerEmail: "user@example.com",
    userId: generateMockCuid(),
  };
}

export function mockedMultipleOAuthAccounts(
  count: number = 3,
): ReturnType<typeof mockedOAuthAccountFullSelect>[] {
  return Array.from({ length: count }, (_, index) => ({
    ...mockedOAuthAccountFullSelect(),
    providerId: `provider${index + 1}`,
    providerEmail: `user${index + 1}@example.com`,
  }));
}
