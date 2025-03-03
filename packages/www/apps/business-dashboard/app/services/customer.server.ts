import {
  customerFlowTrackers,
  teamNotificationSettings,
} from "@acme/database/schema";
import { type Logger } from "~/logging/index.js";
import {
  type CustomerQueryable,
  type CustomerMutable,
  type CustomerRepository,
} from "~/repositories/customers.server.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";
import { notifications } from "./email/notifications.js";

export class CustomerService {
  private logger: Logger;
  private customerMutator: CustomerMutable;
  private customerQuerier: CustomerQueryable;

  constructor({
    logger,
    customerRepo,
  }: {
    logger: Logger;
    customerRepo: CustomerRepository;
  }) {
    this.logger = logger;
    this.customerMutator = customerRepo.getMutator();
    this.customerQuerier = customerRepo.getQuerier();
  }

  async completeWelcomeFlow({ customerId }: { customerId: string }) {
    const flowTracker = await this.customerQuerier.queryCustomerFlowTracker({
      customerId,
      projection: { id: customerFlowTrackers.id },
    });

    if (!flowTracker) {
      throw throwActionErrorAndLog({
        message:
          "A critical error occured. Please contact support for assistance",
        logInfo: {
          logger: this.logger,
          event: "required_table_does_not_exist",
          data: { customerId },
        },
      });
    }

    this.customerMutator.updateFlowTracker({
      customerFlowTrackerId: flowTracker?.id,
      data: { hasCompletedWelcomeFlow: true },
    });
  }

  async selectJobRole({
    jobRole,
    customerId,
  }: {
    jobRole: string;
    customerId: string;
  }) {
    this.customerMutator.updateJobRole({ customerId, jobRole });
  }

  async selectTheme({
    customerId,
    theme,
  }: {
    customerId: string;
    theme: string;
  }) {
    this.customerMutator.updateThemePreference({ customerId, theme });
  }

  async selectActiveTeam({
    customerId,
    teamId,
  }: {
    customerId: string;
    teamId: string;
  }) {
    this.customerMutator.updateActiveTeamId({ customerId, teamId });
  }

  async createTeamNotificationSettingsRows({
    customerId,
    teamId,
  }: {
    customerId: string;
    teamId: string;
  }) {
    const notificationIds = Object.keys(notifications);

    await this.customerMutator.createTeamNotificationSettings({
      notificationIds,
      teamId,
      customerId,
    });
  }

  async toggleTeamNotificationSettingsRows({
    enabled,
    notificationIds,
    customerId,
    teamId,
  }: {
    enabled: boolean;
    notificationIds: string[];
    customerId: string;
    teamId: string;
  }) {
    const existingNotificationSettings =
      await this.customerQuerier.queryTeamNotificationSettings({
        customerId,
        teamId,
        projection: {
          notificationId: teamNotificationSettings.notificationId,
        },
      });

    const existingIds =
      existingNotificationSettings !== undefined
        ? new Set(existingNotificationSettings.map((s) => s.notificationId))
        : new Set();

    const missingIds = notificationIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      await this.customerMutator.createTeamNotificationSettings({
        notificationIds: missingIds,
        enabled,
        teamId,
        customerId,
      });
    }

    await this.customerMutator.toggleTeamNotificationSettings({
      enabled,
      notificationIds,
      teamId,
      customerId,
    });
  }
}
