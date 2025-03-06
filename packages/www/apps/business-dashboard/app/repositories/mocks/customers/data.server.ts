import {
  type customers,
  type customerFlowTrackers,
  type teamNotificationSettings,
} from "@acme/database/schema";
import { generateMockCuid } from "../utils.js";

export function mockedCustomerFullSelect(): typeof customers.$inferSelect {
  return {
    id: generateMockCuid(),
    userId: generateMockCuid(),
    activeTheme: "dark",
    activeTeamId: generateMockCuid(),
    jobRole: null,
    hasUsedTrial: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function mockedCustomerFlowTrackerFullSelect(): typeof customerFlowTrackers.$inferSelect {
  return {
    id: generateMockCuid(),
    customerId: generateMockCuid(),
    hasCompletedWelcomeFlow: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function mockedTeamNotificationSettingFullSelect(): typeof teamNotificationSettings.$inferSelect {
  return {
    id: generateMockCuid(),
    customerId: generateMockCuid(),
    teamId: generateMockCuid(),
    notificationId: generateMockCuid(),
    emailEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function mockedMultipleTeams(count: number = 3): Array<{
  customer_to_customer_teams: any;
  customer_team: any;
}> {
  return Array.from({ length: count }, (_, index) => ({
    customer_to_customer_teams: {
      customerId: generateMockCuid(),
      teamId: generateMockCuid(),
      role: "member",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    customer_team: {
      id: generateMockCuid(),
      name: `Test Team ${index + 1}`,
      slug: `test-team-${index + 1}`,
      imageUrl: `https://example.com/image${index + 1}.jpg`,
      shareableInviteCode: generateMockCuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }));
}

export function mockedMultipleNotificationSettings(
  count: number = 3,
): ReturnType<typeof mockedTeamNotificationSettingFullSelect>[] {
  return Array.from({ length: count }, () =>
    mockedTeamNotificationSettingFullSelect(),
  );
}
