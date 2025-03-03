import { type subscriptions } from "@acme/database/schema";
import { generateMockCuid } from "../utils.js";

export function mockedSubscriptionFullSelect(): typeof subscriptions.$inferSelect {
  return {
    id: generateMockCuid(),
    stripeSubscriptionId: "sub_1234",
    teamId: "team_id_1234",
    status: "active",
    productId: "prod_1234",
    priceId: "price_1234",
    subscriptionItemId: "subi_1234",
    currentPeriodEnd: new Date(),
    billingInterval: "month",
    quantity: 1,
    currentPeriodSeats: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
