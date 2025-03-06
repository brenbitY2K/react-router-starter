import {
  type emailOTPs,
  type emailOTPsForEmailChange,
} from "@acme/database/schema";
import { generateMockCuid } from "../utils.js";

export function mockedEmailOTPFullSelect(): typeof emailOTPs.$inferSelect {
  return {
    id: generateMockCuid(),
    email: "user@example.com",
    code: "123456",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function mockedEmailOTPForEmailChangeFullSelect(): typeof emailOTPsForEmailChange.$inferSelect {
  return {
    id: generateMockCuid(),
    emailToChangeTo: "newuser@example.com",
    userId: generateMockCuid(),
    code: "654321",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
