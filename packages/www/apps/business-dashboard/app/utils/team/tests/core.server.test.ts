import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";
import {
  getTeamFromSlugOrThrow,
  getAllTeamsByCustomerUser,
} from "../core.server.js";
import { teams } from "@acme/database/schema";
import { TeamRepository } from "~/repositories/teams.server.js";
import { UserRepository } from "~/repositories/users.server.js";
import { mockedTeamFullSelect } from "~/repositories/mocks/teams/data.server.js";
import {
  mockTeamRepoQueryTeamWithSlug,
  mockTeamRepoQueryTeamWithSlugUndefined,
} from "~/repositories/mocks/teams/queries.server.js";
import {
  mockUserRepoQueryTeamsForCustomerUserIds,
  mockUserRepoQueryTeamsForCustomerUserIdsEmpty,
  mockUserRepoQueryCustomersByUserIds,
} from "~/repositories/mocks/users/queries.server.js";

describe("Customer Team Functions", () => {
  describe("getTeamFromSlugOrThrow", () => {
    let teamRepo: TeamRepository;
    let mockThrower: Mock<[], never>;

    beforeEach(() => {
      teamRepo = new TeamRepository();
      mockThrower = vi.fn(() => {
        throw new Error("Team not found");
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("throws if query returns undefined", async () => {
      mockTeamRepoQueryTeamWithSlugUndefined({ teamRepo });

      await expect(
        getTeamFromSlugOrThrow({
          teamSlug: "non-existent-slug",
          teamRepo,
          thrower: mockThrower,
          projection: { id: teams.id },
        }),
      ).rejects.toThrow("Team not found");

      expect(mockThrower).toHaveBeenCalledTimes(1);
    });

    it("returns customer team if valid", async () => {
      const teamData = mockedTeamFullSelect();
      mockTeamRepoQueryTeamWithSlug({
        teamRepo,
        data: teamData,
      });

      const result = await getTeamFromSlugOrThrow({
        teamSlug: "valid-team-slug",
        teamRepo,
        thrower: mockThrower,
        projection: { id: teams.id },
      });

      expect(result).toEqual(
        expect.objectContaining({
          id: teamData.id,
        }),
      );
      expect(mockThrower).not.toHaveBeenCalled();
    });
  });

  describe("getAllTeamsByCustomerUser", () => {
    let userRepo: UserRepository;

    beforeEach(() => {
      userRepo = new UserRepository();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("returns correct teams for users with teams", async () => {
      const mockUsers = [
        { id: "user1", name: "User 1", email: "user1@example.com" },
        { id: "user2", name: "User 2", email: "user2@example.com" },
      ];

      const mockTeams = [
        {
          userId: "user1",
          customerId: "customer1",
          email: "user1@example.com",
          team: {
            id: "team1",
            name: "Team 1",
          },
        },
        {
          userId: "user2",
          customerId: "customer2",
          email: "user2@example.com",
          team: {
            id: "team2",
            name: "Team 2",
          },
        },
      ];

      mockUserRepoQueryTeamsForCustomerUserIds({
        userRepo,
        data: mockTeams,
      });

      const result = await getAllTeamsByCustomerUser({
        userQuerier: userRepo.getQuerier(),
        usersWithActiveSession: mockUsers,
      });

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: "user1",
            email: "user1@example.com",
            customerId: "customer1",
            teams: expect.arrayContaining([
              expect.objectContaining({
                id: "team1",
                name: "Team 1",
              }),
            ]),
          }),
          expect.objectContaining({
            userId: "user2",
            email: "user2@example.com",
            customerId: "customer2",
            teams: expect.arrayContaining([
              expect.objectContaining({
                id: "team2",
                name: "Team 2",
              }),
            ]),
          }),
        ]),
      );
    });

    it("handles users without teams correctly", async () => {
      const mockUsers = [
        { id: "user1", name: "User 1", email: "user1@example.com" },
        { id: "user2", name: "User 2", email: "user2@example.com" },
      ];

      const mockTeams = [
        {
          userId: "user1",
          customerId: "customer1",
          email: "user1@example.com",
          team: { id: "team1", name: "Team 1" },
        },
      ];

      const mockCustomersByUserIds = [
        {
          user: { id: "user2", email: "user2@example.com" },
          customer: { id: "customer2" },
        },
      ];

      mockUserRepoQueryTeamsForCustomerUserIds({
        userRepo,
        data: mockTeams,
      });
      mockUserRepoQueryCustomersByUserIds({
        userRepo,
        data: mockCustomersByUserIds,
      });

      const result = await getAllTeamsByCustomerUser({
        userQuerier: userRepo.getQuerier(),
        usersWithActiveSession: mockUsers,
      });

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: "user1",
            email: "user1@example.com",
            customerId: "customer1",
            teams: expect.arrayContaining([
              expect.objectContaining({
                id: "team1",
                name: "Team 1",
              }),
            ]),
          }),
          expect.objectContaining({
            userId: "user2",
            email: "user2@example.com",
            customerId: "customer2",
            teams: [],
          }),
        ]),
      );
    });

    it("returns empty array when no users have teams", async () => {
      const mockUsers = [
        { id: "user1", name: "User 1", email: "user1@example.com" },
        { id: "user2", name: "User 2", email: "user2@example.com" },
      ];

      mockUserRepoQueryTeamsForCustomerUserIdsEmpty({ userRepo });
      mockUserRepoQueryCustomersByUserIds({
        userRepo,
        data: [
          {
            user: { id: "user1", email: "user1@example.com" },
            customer: { id: "customer1" },
          },
          {
            user: { id: "user2", email: "user2@example.com" },
            customer: { id: "customer2" },
          },
        ],
      });

      const result = await getAllTeamsByCustomerUser({
        userQuerier: userRepo.getQuerier(),
        usersWithActiveSession: mockUsers,
      });

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: "user1",
            email: "user1@example.com",
            customerId: "customer1",
            teams: [],
          }),
          expect.objectContaining({
            userId: "user2",
            email: "user2@example.com",
            customerId: "customer2",
            teams: [],
          }),
        ]),
      );
      expect(result.length).toBe(2);
    });
  });
});
