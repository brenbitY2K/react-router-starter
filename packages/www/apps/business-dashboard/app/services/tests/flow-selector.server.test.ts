import { describe, it, expect, beforeEach } from "vitest";
import { FlowSelectorService } from "../flow-selector.server.js";
import { CustomerRepository } from "~/repositories/customers.server.js";
import {
  mockCustomerRepoQueryTeams,
  mockCustomerRepoQueryCustomerFlowTracker,
  mockCustomerRepoQueryCustomerFlowTrackerUndefined,
} from "~/repositories/mocks/customers/queries.server.js";

describe("FlowSelectorService", () => {
  let flowSelectorService: FlowSelectorService;
  let mockCustomerRepo: CustomerRepository;
  let mockCustomer: any;

  beforeEach(() => {
    mockCustomerRepo = new CustomerRepository();
    mockCustomer = {
      id: "customer-1",
      activeTeamId: "team-1",
      activeTheme: "light",
    };
    flowSelectorService = new FlowSelectorService({
      customerRepo: mockCustomerRepo,
      customer: mockCustomer,
    });
  });

  describe("getRedirectPath", () => {
    it('should return "/welcome" if customer has not completed welcome flow', async () => {
      mockCustomerRepoQueryCustomerFlowTracker({
        customerRepo: mockCustomerRepo,
        data: { hasCompletedWelcomeFlow: false },
      });

      const result = await flowSelectorService.getRedirectPath();
      expect(result).toBe("/welcome");
    });

    it('should return "/teams/new" if customer has completed welcome flow but has no teams', async () => {
      mockCustomerRepoQueryCustomerFlowTracker({
        customerRepo: mockCustomerRepo,
        data: { hasCompletedWelcomeFlow: true },
      });
      mockCustomerRepoQueryTeams({
        customerRepo: mockCustomerRepo,
        data: [],
      });

      const result = await flowSelectorService.getRedirectPath();
      expect(result).toBe("/teams/new");
    });

    it("should return active team dashboard path if customer has completed welcome flow and has an active team", async () => {
      mockCustomerRepoQueryCustomerFlowTracker({
        customerRepo: mockCustomerRepo,
        data: { hasCompletedWelcomeFlow: true },
      });
      mockCustomerRepoQueryTeams({
        customerRepo: mockCustomerRepo,
        data: [
          {
            customer_team: { id: "team-1", slug: "active-team" },
            customer_to_customer_teams: { role: "member" },
          },
        ],
      });

      const result = await flowSelectorService.getRedirectPath();
      expect(result).toBe("/active-team/");
    });

    it("should return first team dashboard path if customer has completed welcome flow but active team is not found", async () => {
      mockCustomer.activeTeamId = "non-existent-team";
      mockCustomerRepoQueryCustomerFlowTracker({
        customerRepo: mockCustomerRepo,
        data: { hasCompletedWelcomeFlow: true },
      });
      mockCustomerRepoQueryTeams({
        customerRepo: mockCustomerRepo,
        data: [
          {
            customer_team: { id: "team-2", slug: "first-team" },
            customer_to_customer_teams: { role: "member" },
          },
          {
            customer_team: { id: "team-3", slug: "second-team" },
            customer_to_customer_teams: { role: "member" },
          },
        ],
      });

      const result = await flowSelectorService.getRedirectPath();
      expect(result).toBe("/first-team/");
    });
  });

  describe("checkIfCustomerHasGoneThroughWelcomeFlow", () => {
    it("should return true if customer has completed welcome flow", async () => {
      mockCustomerRepoQueryCustomerFlowTracker({
        customerRepo: mockCustomerRepo,
        data: { hasCompletedWelcomeFlow: true },
      });

      const result = await (
        flowSelectorService as any
      ).checkIfCustomerHasGoneThroughWelcomeFlow();
      expect(result).toBe(true);
    });

    it("should return false if customer has not completed welcome flow", async () => {
      mockCustomerRepoQueryCustomerFlowTracker({
        customerRepo: mockCustomerRepo,
        data: { hasCompletedWelcomeFlow: false },
      });

      const result = await (
        flowSelectorService as any
      ).checkIfCustomerHasGoneThroughWelcomeFlow();
      expect(result).toBe(false);
    });

    it("should return false if customer flow tracker is undefined", async () => {
      mockCustomerRepoQueryCustomerFlowTrackerUndefined({
        customerRepo: mockCustomerRepo,
      });

      const result = await (
        flowSelectorService as any
      ).checkIfCustomerHasGoneThroughWelcomeFlow();
      expect(result).toBe(false);
    });
  });

  describe("getTeamRoute", () => {
    it('should return "/teams/new" if customer has no teams', async () => {
      mockCustomerRepoQueryTeams({
        customerRepo: mockCustomerRepo,
        data: [],
      });

      const result = await (flowSelectorService as any).getTeamRoute();
      expect(result).toBe("/teams/new");
    });

    it("should return active team dashboard path if active team exists", async () => {
      mockCustomerRepoQueryTeams({
        customerRepo: mockCustomerRepo,
        data: [
          {
            customer_team: { id: "team-1", slug: "active-team" },
            customer_to_customer_teams: { role: "member" },
          },
        ],
      });

      const result = await (flowSelectorService as any).getTeamRoute();
      expect(result).toBe("/active-team/");
    });

    it("should return first team dashboard path if active team is not found", async () => {
      mockCustomer.activeTeamId = "non-existent-team";
      mockCustomerRepoQueryTeams({
        customerRepo: mockCustomerRepo,
        data: [
          {
            customer_team: { id: "team-2", slug: "first-team" },
            customer_to_customer_teams: { role: "member" },
          },
          {
            customer_team: { id: "team-3", slug: "second-team" },
            customer_to_customer_teams: { role: "member" },
          },
        ],
      });

      const result = await (flowSelectorService as any).getTeamRoute();
      expect(result).toBe("/first-team/");
    });
  });
});
