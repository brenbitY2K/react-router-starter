import { type users } from "@acme/database/schema";
import { generateMockCuid } from "../utils.js";
import { mockedCustomerFullSelect } from "../customers/data.server.js";

export function mockedUserFullSelect(): typeof users.$inferSelect {
  return {
    id: generateMockCuid(),
    name: "John Doe",
    email: "john.doe@example.com",
    imageUrl: "https://example.com/image.jpg",
    username: "johndoe",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function mockedTeamsForCustomerUserIds(count: number = 3) {
  return Array.from({ length: count }, () => ({
    customerId: generateMockCuid(),
    email: "user@example.com",
    userId: generateMockCuid(),
    team: {
      name: "Test Team",
      id: generateMockCuid(),
      slug: "test-team",
      imageUrl: "https://example.com/team-image.jpg",
    },
  }));
}

export function mockedCustomersByUserIds(count: number = 3) {
  return Array.from({ length: count }, () => ({
    customer: mockedCustomerFullSelect(),
    user: mockedUserFullSelect(),
  }));
}
