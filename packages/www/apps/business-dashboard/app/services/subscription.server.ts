import {
  customers,
  customersToTeams,
  type subscriptions,
  type teams,
  type users,
} from "@acme/database/schema";
import { serverConfig } from "~/config.server";
import { stripe } from "~/lib/stripe.server";
import { getPublicConfig } from "~/public-config";
import {
  type CustomerMutable,
  type CustomerRepository,
} from "~/repositories/customers.server";
import {
  type SubscriptionMutable,
  type SubscriptionRepository,
} from "~/repositories/subscriptions.server";
import {
  type TeamQueryable,
  type TeamMutable,
  type TeamRepository,
} from "~/repositories/teams.server";

const publicConfig = getPublicConfig();

export class SubscriptionService {
  private subscriptionMutator: SubscriptionMutable;
  private teamQuerier: TeamQueryable;
  private teamMutator: TeamMutable;
  private customerMutator: CustomerMutable;

  constructor({
    subscriptionRepo,
    teamRepo,
    customerRepo,
  }: {
    subscriptionRepo: SubscriptionRepository;
    customerRepo: CustomerRepository;
    teamRepo: TeamRepository;
  }) {
    this.subscriptionMutator = subscriptionRepo.getMutator();
    this.teamQuerier = teamRepo.getQuerier();
    this.teamMutator = teamRepo.getMutator();
    this.customerMutator = customerRepo.getMutator();
  }

  async createPortalSession({
    stripeCustomerId,
    teamSlug,
  }: {
    stripeCustomerId: string;
    teamSlug: string;
  }): Promise<string> {
    const domain =
      serverConfig.domain === "localhost"
        ? "http://localhost:3000"
        : `https://${serverConfig.domain}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${domain}/${teamSlug}/settings/billing`,
    });
    return session.url;
  }

  async createCheckoutSession({
    stripeCustomerId,
    team,
    user,
    priceId,
    teamSlug,
    planType,
    interval,
    trialDays = 0,
  }: {
    stripeCustomerId: string | null;
    priceId: string;
    teamSlug: string;
    planType: string;
    interval: string;
    team: Pick<typeof teams.$inferSelect, "name" | "id">;
    user: Pick<typeof users.$inferSelect, "email" | "name">;
    trialDays?: number;
  }) {
    const domain =
      serverConfig.domain === "localhost"
        ? "http://localhost:3000"
        : `https://${serverConfig.domain}`;

    if (!stripeCustomerId) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          teamId: team.id,
          teamName: team.name,
          originalEmail: user.email,
        },
        description: `Team ${team.name} (${team.id}) originally created by ${user.name} (${user.email})`,
      });

      stripeCustomerId = newCustomer.id;
      await this.teamMutator.updateStripeCustomerId({
        teamId: team.id,
        stripeCustomerId: stripeCustomerId,
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      allow_promotion_codes: true,
      payment_method_configuration: publicConfig.stripe.paymentMethodConfigId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${domain}/${teamSlug}/settings/billing/callback?session_id={CHECKOUT_SESSION_ID}&planType=${planType}&billingInterval=${interval}`,
      cancel_url: `${domain}/${teamSlug}/settings/billing`,
      payment_method_collection: "always",
      metadata: { planType, interval, teamId: team.id },
      subscription_data: {
        metadata: { teamId: team.id },
        trial_period_days: trialDays > 0 ? trialDays : undefined,
      },
    });

    return session.url;
  }

  async handleTeamMemberAdded({
    teamId,
    customerId,
    subscription,
  }: {
    teamId: string;
    customerId: string;
    subscription: Pick<
      typeof subscriptions.$inferSelect,
      "stripeSubscriptionId" | "subscriptionItemId" | "currentPeriodSeats"
    >;
  }) {
    const teamMemberRelations = await this.teamQuerier.queryCustomers({
      customerProjection: { id: customers.id, userId: customers.userId },
      customerToTeamsProjection: { role: customersToTeams.role },
      teamId,
    });

    const newTeamMemberCount =
      teamMemberRelations === undefined ? 0 : teamMemberRelations.length + 1;
    const isCurrentPeriodSeatCountIncreasing =
      newTeamMemberCount > subscription.currentPeriodSeats;
    const prorationBehavior = isCurrentPeriodSeatCountIncreasing
      ? "always_invoice"
      : "none";

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: subscription.subscriptionItemId,
          quantity: newTeamMemberCount,
        },
      ],
      proration_behavior: prorationBehavior,
    });

    if (isCurrentPeriodSeatCountIncreasing) {
      await this.subscriptionMutator.updateSubscription({
        data: { currentPeriodSeats: newTeamMemberCount },
        teamId,
      });
    }

    await this.customerMutator.setHasUsedTrialStatus({
      value: true,
      customerIds: [customerId],
    });

    await this.subscriptionMutator.recordSeatChange({
      teamId,
      previousCount: newTeamMemberCount - 1,
      newCount: newTeamMemberCount,
    });
  }

  async handleTeamMemberRemoved({
    teamId,
    subscription,
  }: {
    teamId: string;
    subscription: Pick<
      typeof subscriptions.$inferSelect,
      "stripeSubscriptionId" | "subscriptionItemId" | "currentPeriodSeats"
    >;
  }) {
    const teamMemberRelations = await this.teamQuerier.queryCustomers({
      customerProjection: { id: customers.id, userId: customers.userId },
      customerToTeamsProjection: { role: customersToTeams.role },
      teamId,
    });

    const newTeamMemberCount =
      teamMemberRelations === undefined ? 0 : teamMemberRelations.length - 1;

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: subscription.subscriptionItemId,
          quantity: newTeamMemberCount,
        },
      ],
      billing_cycle_anchor: "unchanged",
      proration_behavior: "none",
    });

    await this.subscriptionMutator.recordSeatChange({
      teamId,
      previousCount: newTeamMemberCount + 1,
      newCount: newTeamMemberCount,
    });
  }
}
