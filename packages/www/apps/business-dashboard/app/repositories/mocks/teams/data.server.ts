import {
  type teamEmailInvites,
  type teams,
  type customersToTeams,
} from "@acme/database/schema";
import { generateMockCuid } from "../utils.js";

export function mockedCustomerToTeamRelationFullSelect(): typeof customersToTeams.$inferSelect {
  return {
    teamId: generateMockCuid(),
    createdAt: new Date(),
    updatedAt: new Date(),
    customerId: generateMockCuid(),
    role: "member",
  };
}

export function mockedTeamFullSelect(): typeof teams.$inferSelect {
  return {
    id: generateMockCuid(),
    name: "Test Team",
    slug: "test-team",
    imageUrl: "asdf",
    shareableInviteCode: generateMockCuid(),
    stripeCustomerId: "cus_1234",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function mockedTeamEmailInviteFullSelect(): typeof teamEmailInvites.$inferSelect {
  return {
    teamId: generateMockCuid(),
    createdAt: new Date(),
    updatedAt: new Date(),
    code: generateMockCuid(),
    email: "test@gmail.com",
    role: "admin",
  };
}

export function mockedMultipleTeams(
  count: number = 3,
): (typeof teams.$inferSelect)[] {
  return Array.from({ length: count }, (_, index) => ({
    ...mockedTeamFullSelect(),
    name: `Test Team ${index + 1}`,
    slug: `test-team-${index + 1}`,
  }));
}

export function mockedMultipleEmailInvites(
  count: number = 3,
): (typeof teamEmailInvites.$inferSelect)[] {
  return Array.from({ length: count }, (_, index) => ({
    ...mockedTeamEmailInviteFullSelect(),
    email: `test${index + 1}@example.com`,
  }));
}
