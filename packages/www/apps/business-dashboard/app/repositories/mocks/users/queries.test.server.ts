import { describe, it, expect } from "vitest";
import {
  mockUserRepoQueryOAuthAccounts,
  mockUserRepoQueryCustomersByUserIds,
} from "./queries.server.js";
import { mockedCustomersByUserIds } from "./data.server.js";
import { UserRepository } from "~/repositories/users.server.js";
import { mockedOAuthAccountFullSelect } from "../oauth-accounts/data.server.js";

describe("User Repository Mocks", () => {
  const mockUserRepo = new UserRepository();

  describe("mockUserRepoQueryOAuthAccounts", () => {
    it("should return default data when no custom data is provided", async () => {
      const mock = mockUserRepoQueryOAuthAccounts({ userRepo: mockUserRepo });
      const result = await mock.mock.results[0].value({ userId: "test-user" });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ...mockedOAuthAccountFullSelect(),
        userId: "test-user",
      });
    });

    it("should return custom data when provided", async () => {
      const customData = [{ providerUserId: "custom-id" }];
      const mock = mockUserRepoQueryOAuthAccounts({
        userRepo: mockUserRepo,
        data: customData,
      });
      const result = await mock.mock.results[0].value({ userId: "test-user" });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ...mockedOAuthAccountFullSelect(),
        userId: "test-user",
        providerUserId: "custom-id",
      });
    });

    it("should return an empty array when null is provided", async () => {
      const mock = mockUserRepoQueryOAuthAccounts({
        userRepo: mockUserRepo,
        data: null,
      });
      const result = await mock.mock.results[0].value({ userId: "test-user" });
      expect(result).toEqual([]);
    });

    it("should return an empty array when an empty array is provided", async () => {
      const mock = mockUserRepoQueryOAuthAccounts({
        userRepo: mockUserRepo,
        data: [],
      });
      const result = await mock.mock.results[0].value({ userId: "test-user" });
      expect(result).toEqual([]);
    });
  });

  describe("mockUserRepoQueryCustomersByUserIds", () => {
    it("should return default data when no custom data is provided", async () => {
      const mock = mockUserRepoQueryCustomersByUserIds({
        userRepo: mockUserRepo,
      });
      const result = await mock.mock.results[0].value({
        userIds: ["user1", "user2"],
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject(mockedCustomersByUserIds()[0]);
      expect(result[1]).toMatchObject(mockedCustomersByUserIds()[1]);
    });

    it("should return custom data when provided", async () => {
      const customData = [{ customer: { id: "custom-customer-id" } }];
      const mock = mockUserRepoQueryCustomersByUserIds({
        userRepo: mockUserRepo,
        data: customData,
      });
      const result = await mock.mock.results[0].value({ userIds: ["user1"] });
      expect(result).toHaveLength(1);
      expect(result[0].customer).toHaveProperty("id", "custom-customer-id");
    });

    it("should return an empty array when null is provided", async () => {
      const mock = mockUserRepoQueryCustomersByUserIds({
        userRepo: mockUserRepo,
        data: null,
      });
      const result = await mock.mock.results[0].value({ userIds: ["user1"] });
      expect(result).toEqual([]);
    });

    it("should return an empty array when an empty array is provided", async () => {
      const mock = mockUserRepoQueryCustomersByUserIds({
        userRepo: mockUserRepo,
        data: [],
      });
      const result = await mock.mock.results[0].value({ userIds: ["user1"] });
      expect(result).toEqual([]);
    });

    it("should merge custom data with default data", async () => {
      const customData = [{ user: { email: "custom@example.com" } }];
      const mock = mockUserRepoQueryCustomersByUserIds({
        userRepo: mockUserRepo,
        data: customData,
      });
      const result = await mock.mock.results[0].value({ userIds: ["user1"] });
      expect(result).toHaveLength(1);
      expect(result[0].user).toHaveProperty("email", "custom@example.com");
      expect(result[0].customer).toBeDefined();
    });
  });
});
