import { describe, it, expect, beforeEach } from "vitest";
import { CustomerService } from "../customer.server.js";
import { CustomerRepository } from "~/repositories/customers.server.js";
import {
  mockCustomerRepoQueryCustomerFlowTrackerUndefined,
  mockCustomerRepoQueryTeamNotificationSettings,
  mockCustomerRepoQueryTeamNotificationSettingsUndefined,
} from "~/repositories/mocks/customers/queries.server.js";
import {
  mockCustomerRepoUpdateThemePreference,
  mockCustomerRepoCreateTeamNotificationSettings,
  mockCustomerRepoToggleTeamNotificationSettings,
} from "~/repositories/mocks/customers/mutations.server.js";
import { notifications } from "../email/notifications.js";
import { mockedLogger } from "~/logging/mocks/index.js";

describe("CustomerService", () => {
  let customerService: CustomerService;
  let mockLogger: any;
  let mockCustomerRepo: CustomerRepository;

  beforeEach(() => {
    mockLogger = mockedLogger;
    mockCustomerRepo = new CustomerRepository();
    customerService = new CustomerService({
      logger: mockLogger,
      customerRepo: mockCustomerRepo,
    });
  });

  describe("completeWelcomeFlow", () => {
    it("should throw an error if flow tracker is not found", async () => {
      mockCustomerRepoUpdateThemePreference({ customerRepo: mockCustomerRepo });
      mockCustomerRepoQueryCustomerFlowTrackerUndefined({
        customerRepo: mockCustomerRepo,
      });

      await expect(
        customerService.completeWelcomeFlow({
          customerId: "customer1",
        }),
      ).rejects.toThrow(
        "A critical error occured. Please contact support for assistance",
      );
    });
  });

  describe("selectTheme", () => {
    it("should update theme preference", async () => {
      const mockUpdateTheme = mockCustomerRepoUpdateThemePreference({
        customerRepo: mockCustomerRepo,
      });

      await customerService.selectTheme({
        customerId: "customer1",
        theme: "light",
      });

      expect(mockUpdateTheme).toHaveBeenCalledWith({
        customerId: "customer1",
        theme: "light",
      });
    });
  });

  describe("createTeamNotificationSettingsRows", () => {
    it("should create notification settings for all notifications", async () => {
      const mockCreateSettings = mockCustomerRepoCreateTeamNotificationSettings(
        {
          customerRepo: mockCustomerRepo,
        },
      );

      await customerService.createTeamNotificationSettingsRows({
        customerId: "customer1",
        teamId: "team1",
      });

      expect(mockCreateSettings).toHaveBeenCalledWith({
        notificationIds: Object.keys(notifications),
        teamId: "team1",
        customerId: "customer1",
      });
    });
  });

  describe("toggleTeamNotificationSettingsRows", () => {
    it("should create missing notification settings and toggle all", async () => {
      mockCustomerRepoQueryTeamNotificationSettings({
        customerRepo: mockCustomerRepo,
        data: [{ notificationId: "notification1" }],
      });
      const mockCreateSettings = mockCustomerRepoCreateTeamNotificationSettings(
        {
          customerRepo: mockCustomerRepo,
        },
      );
      const mockToggleSettings = mockCustomerRepoToggleTeamNotificationSettings(
        {
          customerRepo: mockCustomerRepo,
        },
      );

      await customerService.toggleTeamNotificationSettingsRows({
        enabled: true,
        notificationIds: ["notification1", "notification2"],
        customerId: "customer1",
        teamId: "team1",
      });

      expect(mockCreateSettings).toHaveBeenCalledWith({
        notificationIds: ["notification2"],
        enabled: true,
        teamId: "team1",
        customerId: "customer1",
      });
      expect(mockToggleSettings).toHaveBeenCalledWith({
        enabled: true,
        notificationIds: ["notification1", "notification2"],
        teamId: "team1",
        customerId: "customer1",
      });
    });

    it("should only toggle settings if all exist", async () => {
      mockCustomerRepoQueryTeamNotificationSettings({
        customerRepo: mockCustomerRepo,
        data: [
          { notificationId: "notification1" },
          { notificationId: "notification2" },
        ],
      });
      const mockCreateSettings = mockCustomerRepoCreateTeamNotificationSettings(
        {
          customerRepo: mockCustomerRepo,
        },
      );
      const mockToggleSettings = mockCustomerRepoToggleTeamNotificationSettings(
        {
          customerRepo: mockCustomerRepo,
        },
      );

      await customerService.toggleTeamNotificationSettingsRows({
        enabled: false,
        notificationIds: ["notification1", "notification2"],
        customerId: "customer1",
        teamId: "team1",
      });

      expect(mockCreateSettings).not.toHaveBeenCalled();
      expect(mockToggleSettings).toHaveBeenCalledWith({
        enabled: false,
        notificationIds: ["notification1", "notification2"],
        teamId: "team1",
        customerId: "customer1",
      });
    });

    it("should create all settings if none exist", async () => {
      mockCustomerRepoQueryTeamNotificationSettingsUndefined({
        customerRepo: mockCustomerRepo,
      });
      const mockCreateSettings = mockCustomerRepoCreateTeamNotificationSettings(
        {
          customerRepo: mockCustomerRepo,
        },
      );
      const mockToggleSettings = mockCustomerRepoToggleTeamNotificationSettings(
        {
          customerRepo: mockCustomerRepo,
        },
      );

      await customerService.toggleTeamNotificationSettingsRows({
        enabled: true,
        notificationIds: ["notification1", "notification2"],
        customerId: "customer1",
        teamId: "team1",
      });

      expect(mockCreateSettings).toHaveBeenCalledWith({
        notificationIds: ["notification1", "notification2"],
        enabled: true,
        teamId: "team1",
        customerId: "customer1",
      });
      expect(mockToggleSettings).toHaveBeenCalledWith({
        enabled: true,
        notificationIds: ["notification1", "notification2"],
        teamId: "team1",
        customerId: "customer1",
      });
    });
  });
});
