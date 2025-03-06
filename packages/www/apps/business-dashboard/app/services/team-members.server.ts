import {
  customersToTeams,
  type subscriptions,
  type teams,
} from "@acme/database/schema";
import { type Logger } from "~/logging/index.js";
import {
  type TeamMutable,
  type TeamQueryable,
  type TeamRepository,
} from "~/repositories/teams.server.js";
import { type EmailService } from "~/services/email/email.server.js";
import { type TeamRole } from "~/utils/permissions/core.server.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";
import {
  createTeamInviteLink,
  type TeamInviteInfo,
} from "~/utils/team-invite/core.server.js";
import { TeamInvitationTemplate } from "./email/templates.js";
import { type CustomerService } from "./customer.server.js";
import { type SubscriptionService } from "./subscription.server.js";
import { fromEmailAddress } from "~/utils/email.server.js";

export class TeamMemberService {
  private logger: Logger;
  private teamQuerier: TeamQueryable;
  private teamMutator: TeamMutable;

  constructor({
    logger,
    teamRepo,
  }: {
    logger: Logger;
    teamRepo: TeamRepository;
  }) {
    this.logger = logger;

    this.teamQuerier = teamRepo.getQuerier();
    this.teamMutator = teamRepo.getMutator();
  }

  async removeCustomer({
    teamId,
    customerId,
    subscription,
    subscriptionService,
  }: {
    teamId: string;
    customerId: string;
    subscription?: Pick<
      typeof subscriptions.$inferSelect,
      "stripeSubscriptionId" | "subscriptionItemId" | "currentPeriodSeats"
    >;
    subscriptionService: SubscriptionService;
  }) {
    const customerToBeDeletedMembershipInfo =
      await this.teamQuerier.queryCustomerToTeamRelation({
        teamId,
        customerId,
        projection: { role: customersToTeams.role },
      });

    if (customerToBeDeletedMembershipInfo === undefined) return;

    if (customerToBeDeletedMembershipInfo.role === "owner") {
      throw throwActionErrorAndLog({
        message: "You cannot remove the owner of this team.",
        logInfo: { logger: this.logger, event: "unauthorized" },
      });
    }

    if (subscription)
      // We shouldn't block users from removing team members
      // just b/c they don't have a subscription
      await subscriptionService.handleTeamMemberRemoved({
        teamId,
        subscription,
      });

    await this.teamMutator.removeCustomerFromTeam({
      customerId,
      teamId,
    });
  }

  async cancelEmailInvite({ teamId, code }: { teamId: string; code: string }) {
    await this.teamMutator.deleteEmailInvite({ teamId, code });
  }

  async changeCustomerRole({
    customerId,
    teamId,
    role,
  }: {
    customerId: string;
    teamId: string;
    role: TeamRole;
  }) {
    await this.teamMutator.updateCustomerRole({
      customerId,
      role,
      teamId,
    });
  }

  async toggleInviteLink({
    teamId,
    newStatus,
  }: {
    teamId: string;
    newStatus: "on" | "off";
  }) {
    if (newStatus === "on") {
      await this.teamMutator.createShareableInvitation({ teamId });
      return;
    }

    await this.teamMutator.deleteShareableInvitaiton({ teamId });
  }

  async refreshInviteLink({ teamId }: { teamId: string }) {
    await this.teamMutator.createShareableInvitation({ teamId });
  }

  async sendEmailInvitations({
    team,
    emails,
    emailService,
    role,
    senderCustomerName,
  }: {
    team: Pick<typeof teams.$inferSelect, "name" | "id" | "slug">;
    emails: string[];
    emailService: EmailService;
    role: TeamRole;
    senderCustomerName: string;
  }) {
    await this.teamMutator.deleteExistingEmailInvites({
      teamId: team.id,
      emails,
    });

    const invitationCodes = await this.teamMutator.createEmailInvitations({
      teamId: team.id,
      emails,
      role,
    });

    const sendEmailPromises = emails.map((email, i) => {
      const invitationCode = invitationCodes[i];
      if (invitationCode === undefined) {
        throw new Error(`Invitation code for email ${email} is undefined.`);
      }
      return emailService.sendTemplate({
        to: email,
        from: fromEmailAddress.noReply,
        template: new TeamInvitationTemplate({
          team_name: team.name,
          invitation_url: createTeamInviteLink(team.slug, invitationCode),
          invite_sender_name: senderCustomerName,
        }),
      });
    });

    await Promise.all(sendEmailPromises);
  }

  async redeemInvite({
    teamInviteInfo,
    teamId,
    customerId,
    customerService,
    subscription,
    subscriptionService,
  }: {
    teamInviteInfo: TeamInviteInfo;
    teamId: string;
    customerId: string;
    customerService: CustomerService;
    subscription: Pick<
      typeof subscriptions.$inferSelect,
      "stripeSubscriptionId" | "subscriptionItemId" | "currentPeriodSeats"
    >;
    subscriptionService: SubscriptionService;
  }) {
    try {
      await subscriptionService.handleTeamMemberAdded({
        teamId,
        subscription,
        customerId,
      });

      await this.teamMutator.addCustomer({
        customerId,
        teamId,
        role: teamInviteInfo.role ?? "member",
      });

      await customerService.createTeamNotificationSettingsRows({
        customerId,
        teamId,
      });

      customerService.completeWelcomeFlow({ customerId });

      if (teamInviteInfo.type === "email")
        await this.teamMutator.deleteEmailInvite({
          teamId,
          code: teamInviteInfo.code,
        });
    } catch (error) {
      if (error instanceof Error && error.name === "PostgresError") {
        throw throwActionErrorAndLog({
          message: "You are already a member of this team.",
          logInfo: {
            logger: this.logger,
            event: "team_slug_already_in_use",
          },
        });
      }

      throw error;
    }
  }
}
