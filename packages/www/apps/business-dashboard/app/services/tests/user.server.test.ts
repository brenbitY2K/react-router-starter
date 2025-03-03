import { describe, it, expect, beforeEach } from "vitest";
import { UserService } from "../user.server.js";
import { UserRepository } from "~/repositories/users.server.js";
import {
  mockUserRepoQueryUser,
  mockUserRepoQueryUserUndefined,
  mockUserRepoQueryUserWithEmail,
  mockUserRepoQueryUserWithEmailUndefined,
} from "~/repositories/mocks/users/queries.server.js";
import {
  mockUserRepoUpdateCoreProfileInfo,
  mockUserRepoDeleteOAuthAccount,
} from "~/repositories/mocks/users/mutations.server.js";
import { mockedLogger } from "~/logging/mocks/index.js";
import { type Logger } from "~/logging/index.js";

describe("UserService", () => {
  let userService: UserService;
  let mockLogger: Logger;
  let mockUserRepo: UserRepository;

  beforeEach(() => {
    mockLogger = mockedLogger;
    mockUserRepo = new UserRepository();
    userService = new UserService({
      logger: mockLogger,
      userRepo: mockUserRepo,
    });
  });

  describe("checkIfEmailIsAvailableForUse", () => {
    it("should throw an error if user is not found", async () => {
      mockUserRepoQueryUserUndefined({ userRepo: mockUserRepo });

      await expect(
        userService.checkIfEmailIsAvailableForUse({
          userId: "non-existent",
          email: "test@example.com",
        }),
      ).rejects.toThrow("An unkown error occured. Please try again later.");
    });

    it("should throw an error if the email is already in use by the user", async () => {
      mockUserRepoQueryUser({
        userRepo: mockUserRepo,
        data: { email: "existing@example.com" },
      });

      await expect(
        userService.checkIfEmailIsAvailableForUse({
          userId: "user1",
          email: "existing@example.com",
        }),
      ).rejects.toThrow("You're already using this email.");
    });

    it("should return false if the email is in use by another user", async () => {
      mockUserRepoQueryUser({
        userRepo: mockUserRepo,
        data: { email: "current@example.com" },
      });
      mockUserRepoQueryUserWithEmail({
        userRepo: mockUserRepo,
        data: { id: "another-user" },
      });

      const result = await userService.checkIfEmailIsAvailableForUse({
        userId: "user1",
        email: "taken@example.com",
      });
      expect(result).toBe(false);
    });

    it("should return true if the email is available", async () => {
      mockUserRepoQueryUser({
        userRepo: mockUserRepo,
        data: { email: "current@example.com" },
      });
      mockUserRepoQueryUserWithEmailUndefined({ userRepo: mockUserRepo });

      const result = await userService.checkIfEmailIsAvailableForUse({
        userId: "user1",
        email: "new@example.com",
      });
      expect(result).toBe(true);
    });
  });

  describe("updateCoreProfileInfo", () => {
    it("should call userMutator.updateCoreProfileInfo with correct parameters", async () => {
      const mockUpdateCoreProfileInfo = mockUserRepoUpdateCoreProfileInfo({
        userRepo: mockUserRepo,
      });

      await userService.updateCoreProfileInfo({
        userId: "user1",
        name: "New Name",
        username: "newusername",
        imageUrl: "https://example.com/image.jpg",
      });

      expect(mockUpdateCoreProfileInfo).toHaveBeenCalledWith({
        userId: "user1",
        data: {
          name: "New Name",
          username: "newusername",
          imageUrl: "https://example.com/image.jpg",
        },
      });
    });
  });

  describe("disconnectConnectedAccount", () => {
    it("should call userMutator.deleteOAuthAccount with correct parameters", async () => {
      const mockDeleteOAuthAccount = mockUserRepoDeleteOAuthAccount({
        userRepo: mockUserRepo,
      });

      await userService.disconnectConnectedAccount({
        userId: "user1",
        providerId: "google",
      });

      expect(mockDeleteOAuthAccount).toHaveBeenCalledWith({
        userId: "user1",
        providerId: "google",
      });
    });
  });
});
