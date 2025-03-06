import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TeamMemberService } from "../team-members.server.js";
import { mockedLogger } from "~/logging/mocks/index.js";
import { TeamRepository } from "~/repositories/teams.server.js";
import { mockedCustomerToTeamRelationFullSelect } from "~/repositories/mocks/teams/data.server.js";
import {
  mockTeamRepoQueryCustomerToTeamRelation,
  mockTeamRepoQueryCustomerToTeamRelationUndefined,
} from "~/repositories/mocks/teams/queries.server.js";
import { mockTeamRepoRemoveCustomerFromTeam } from "~/repositories/mocks/teams/mutations.server.js";
import { type TeamRole } from "~/utils/permissions/core.server.js";
import { mockedSubscriptionFullSelect } from "~/repositories/mocks/subscriptions/data.server.js";
import { type SubscriptionService } from "../subscription.server.js";

describe("TeamMemberService.removeCustomer", () => {
  let teamRepo: TeamRepository;
  let service: TeamMemberService;

  beforeEach(() => {
    teamRepo = new TeamRepository();
    service = new TeamMemberService({
      logger: mockedLogger,
      teamRepo,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should take no action if relation query is undefined", async () => {
    const queryCustomerToTeamRelationSpy =
      mockTeamRepoQueryCustomerToTeamRelationUndefined({
        teamRepo,
      });
    const removeCustomerFromTeamSpy = mockTeamRepoRemoveCustomerFromTeam({
      teamRepo,
    });

    const mockSubscriptionService = {
      handleTeamMemberRemoved: vi.fn(),
    } as unknown as SubscriptionService;

    await service.removeCustomer({
      teamId: "1234",
      customerId: "1234",
      subscription: mockedSubscriptionFullSelect(),
      subscriptionService: mockSubscriptionService,
    });

    expect(queryCustomerToTeamRelationSpy).toHaveBeenCalledOnce();
    expect(removeCustomerFromTeamSpy).not.toHaveBeenCalled();
  });

  it("should throw an error if trying to remove the owner", async () => {
    mockTeamRepoQueryCustomerToTeamRelation({
      teamRepo,
      data: { role: "owner" },
    });

    const mockSubscriptionService = {
      handleTeamMemberRemoved: vi.fn(),
    } as unknown as SubscriptionService;

    await expect(
      service.removeCustomer({
        customerId: "1234",
        teamId: "12345",
        subscriptionService: mockSubscriptionService,
        subscription: mockedSubscriptionFullSelect(),
      }),
    ).rejects.toThrow();
  });

  it.each([{ role: "member" }, { role: "admin" }])(
    "should delete if role is $role",
    async ({ role }) => {
      const queryCustomerToTeamRelationSpy =
        mockTeamRepoQueryCustomerToTeamRelation({
          teamRepo,
          data: {
            ...mockedCustomerToTeamRelationFullSelect(),
            role: role as TeamRole,
          },
        });
      const removeCustomerFromTeamSpy = mockTeamRepoRemoveCustomerFromTeam({
        teamRepo,
      });

      const mockSubscriptionService = {
        handleTeamMemberRemoved: vi.fn(),
      } as unknown as SubscriptionService;

      await service.removeCustomer({
        teamId: "12345",
        customerId: "1234",
        subscription: mockedSubscriptionFullSelect(),
        subscriptionService: mockSubscriptionService,
      });

      expect(queryCustomerToTeamRelationSpy).toHaveBeenCalledOnce();
      expect(removeCustomerFromTeamSpy).toHaveBeenCalledOnce();
    },
  );
});
