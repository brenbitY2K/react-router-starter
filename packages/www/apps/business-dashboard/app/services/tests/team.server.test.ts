import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeamService } from "../team.server.js";
import { TeamRepository } from "~/repositories/teams.server.js";
import { type CustomerService } from "../customer.server.js";
import {
  mockTeamRepoAddCustomer,
  mockTeamRepoCreateShareableInvitation,
  mockTeamRepoTeamCreate,
  mockTeamRepoUpdateGeneralInfo,
} from "~/repositories/mocks/teams/mutations.server.js";
import { mockedLogger } from "~/logging/mocks/index.js";

describe("TeamService", () => {
  let teamService: TeamService;
  let mockLogger: any;
  let mockTeamRepo: TeamRepository;
  let mockCustomerService: CustomerService;

  beforeEach(() => {
    mockLogger = mockedLogger;
    mockTeamRepo = new TeamRepository();
    teamService = new TeamService({
      logger: mockLogger,
      teamRepo: mockTeamRepo,
    });
    mockCustomerService = {
      createTeamNotificationSettingsRows: vi.fn(),
    } as unknown as CustomerService;
  });

  describe("createTeam", () => {
    it("should create a team, add owner, create notification settings, and enable shareable invites", async () => {
      const mockCreateTeam = mockTeamRepoTeamCreate({
        teamRepo: mockTeamRepo,
      });
      mockCreateTeam.mockResolvedValue("team1");
      const mockAddCustomer = mockTeamRepoAddCustomer({
        teamRepo: mockTeamRepo,
      });

      await teamService.createTeam({
        ownerCustomerId: "customer1",
        name: "New Team",
        customerService: mockCustomerService,
      });

      expect(mockCreateTeam).toHaveBeenCalledWith({
        slug: "new-team",
        name: "New Team",
      });
      expect(mockAddCustomer).toHaveBeenCalledWith({
        teamId: "team1",
        customerId: "customer1",
        role: "owner",
      });
      expect(
        mockCustomerService.createTeamNotificationSettingsRows,
      ).toHaveBeenCalledWith({
        customerId: "customer1",
        teamId: "team1",
      });
    });
  });

  describe("updateGeneralInfo", () => {
    it("should update general info with all fields", async () => {
      const mockUpdateGeneralInfo = mockTeamRepoUpdateGeneralInfo({
        teamRepo: mockTeamRepo,
      });

      await teamService.updateGeneralInfo({
        teamId: "team1",
        name: "Updated Team",
        slug: "updated-team",
        imageUrl: "https://example.com/image.jpg",
      });

      expect(mockUpdateGeneralInfo).toHaveBeenCalledWith({
        teamId: "team1",
        data: {
          name: "Updated Team",
          slug: "updated-team",
          imageUrl: "https://example.com/image.jpg",
        },
      });
    });

    it("should update general info with partial fields", async () => {
      const mockUpdateGeneralInfo = mockTeamRepoUpdateGeneralInfo({
        teamRepo: mockTeamRepo,
      });

      await teamService.updateGeneralInfo({
        teamId: "team1",
        name: "Updated Team",
      });

      expect(mockUpdateGeneralInfo).toHaveBeenCalledWith({
        teamId: "team1",
        data: {
          name: "Updated Team",
          slug: undefined,
          imageUrl: undefined,
        },
      });
    });
  });
});
