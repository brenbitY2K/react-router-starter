import {
  customers,
  customersToTeams,
  teams,
  users,
} from "@acme/database/schema";
import type Stripe from "stripe";
import { type Logger } from "~/logging/index.js";
import {
  type CustomerMutable,
  type CustomerRepository,
} from "~/repositories/customers.server";
import {
  type SubscriptionMutable,
  type SubscriptionRepository,
} from "~/repositories/subscriptions.server.js";
import {
  type TeamQueryable,
  type TeamRepository,
} from "~/repositories/teams.server";
import {
  type UserQueryable,
  type UserRepository,
} from "~/repositories/users.server";
import { createKlaviyoServerEvent } from "~/utils/analytics/klaviyo/klaviyo.server";
import { throwAPIerrorAndLog } from "~/utils/response.server.js";
import { getProductSlugFromId } from "~/utils/stripe.server";

export class SubscriptionWebhookService {
  private logger: Logger;
  private subscriptionMutator: SubscriptionMutable;
  private teamQuerier: TeamQueryable;
  private customerMutator: CustomerMutable;
  private userQuerier: UserQueryable;

  constructor({
    logger,
    subscriptionRepo,
    teamRepo,
    customerRepo,
    userRepo,
  }: {
    logger: Logger;
    subscriptionRepo: SubscriptionRepository;
    customerRepo: CustomerRepository;
    teamRepo: TeamRepository;
    userRepo: UserRepository;
  }) {
    this.logger = logger;
    this.subscriptionMutator = subscriptionRepo.getMutator();
    this.teamQuerier = teamRepo.getQuerier();
    this.customerMutator = customerRepo.getMutator();
    this.userQuerier = userRepo.getQuerier();
  }

  async handleCreateOrUpdateWebhookEvent(
    subscription: Stripe.Subscription,
    previousAttributes?: Partial<Stripe.Subscription>,
  ) {
    if (subscription.customer == null) {
      throw throwAPIerrorAndLog({
        message: "Customer is missing from subscription",
        status: 400,
        logInfo: {
          logger: this.logger,
          event: "stripe_missing_or_invalid_data",
          data: { subscriptionId: subscription.id },
        },
      });
    }
    const stripeCustomerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    const team = await this.teamQuerier.queryTeamByStripeCustomerId({
      stripeCustomerId,
      projection: { id: teams.id },
    });

    if (!team) {
      throw throwAPIerrorAndLog({
        message: `No team found for Stripe subscription: ${subscription}`,
        status: 400,
        logInfo: {
          logger: this.logger,
          event: "stripe_missing_or_invalid_data",
          data: { subscriptionId: subscription.id },
        },
      });
    }

    const billingInterval =
      subscription.items.data[0].price.recurring?.interval || "unknown";
    const productId =
      typeof subscription.items.data[0].price.product === "string"
        ? subscription.items.data[0].price.product
        : subscription.items.data[0].price.product.id;
    const priceId = subscription.items.data[0].price.id;

    await this.subscriptionMutator.createOrUpdateSubscription({
      teamId: team.id,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      productId,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      priceId,
      subscriptionItemId: subscription.items.data[0].id,
      billingInterval,
      quantity: subscription.items.data[0].quantity || 1,
    });

    const customersInTeam = await this.teamQuerier.queryCustomers({
      teamId: team.id,
      customerProjection: { id: customers.id, userId: customers.userId },
      customerToTeamsProjection: { role: customersToTeams.role },
    });

    await this.updateCurrentPeriodSeatsIfNecessary({
      previousAttributes,
      teamId: team.id,
      subscription,
    });

    // This shouldn't ever happen, but checking for typesafety
    if (!customersInTeam) return;

    if (
      subscription.status === "active" ||
      subscription.status === "trialing"
    ) {
      // Any customer that is a part of a team with a trialing or active
      // subscription will lose the right to a trial in the future.
      await this.customerMutator.setHasUsedTrialStatus({
        value: true,
        customerIds: customersInTeam.map(({ customer }) => customer.id),
      });
    }

    const ownerCustomer = customersInTeam.filter(
      (customerInfo) =>
        customerInfo.customer_to_customer_teams.role === "owner",
    )[0];
    if (!ownerCustomer) return;

    const userInfo = await this.userQuerier.queryUser({
      userId: ownerCustomer.customer.userId,
      projection: { email: users.email, id: users.id },
    });

    if (!userInfo) return;

    await this.sendKlaviyoEventForSubscriptionCreateOrUpdate(
      userInfo,
      subscription,
    );
  }

  async handleDeleteSubscriptionWebhookEvent(
    subscription: Stripe.Subscription,
  ) {
    const stripeCustomerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    await this.subscriptionMutator.deleteSubscription({
      stripeSubscriptionId: subscription.id,
    });

    const team = await this.teamQuerier.queryTeamByStripeCustomerId({
      stripeCustomerId,
      projection: { id: teams.id },
    });

    if (!team) return;

    const customersInTeam = await this.teamQuerier.queryCustomers({
      teamId: team.id,
      customerProjection: { id: customers.id, userId: customers.userId },
      customerToTeamsProjection: { role: customersToTeams.role },
    });

    if (!customersInTeam) return;

    const ownerCustomer = customersInTeam.filter(
      (customerInfo) =>
        customerInfo.customer_to_customer_teams.role === "owner",
    )[0];
    if (!ownerCustomer) return;

    const userInfo = await this.userQuerier.queryUser({
      userId: ownerCustomer.customer.userId,
      projection: { email: users.email, id: users.id },
    });

    if (!userInfo) return;

    const { eventProperties, profileAttributes } =
      createKlaviyoSubscriptionEventData({
        teamOwnerInfo: userInfo,
        subscription,
      });

    await createKlaviyoServerEvent({
      eventName: "Subscription Cancelled",
      eventProperties: {
        ...eventProperties,
        CancellationDate: new Date(
          subscription.cancel_at! * 1000,
        ).toISOString(),
        CurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000,
        ).toISOString(),
      },
      profileAttributes: {
        ...profileAttributes,
      },
    });
  }

  private async updateCurrentPeriodSeatsIfNecessary({
    subscription,
    previousAttributes,
    teamId,
  }: {
    subscription: Stripe.Subscription;
    previousAttributes?: Partial<Stripe.Subscription>;
    teamId: string;
  }) {
    if (
      previousAttributes?.current_period_start &&
      subscription.current_period_start >
        previousAttributes?.current_period_start
    ) {
      const teamMemberRelations = await this.teamQuerier.queryCustomers({
        customerProjection: { id: customers.id, userId: customers.userId },
        customerToTeamsProjection: { role: customersToTeams.role },
        teamId,
      });

      await this.subscriptionMutator.updateSubscription({
        teamId,
        data: { currentPeriodSeats: teamMemberRelations?.length ?? 0 },
      });
    }
  }

  private async sendKlaviyoEventForSubscriptionCreateOrUpdate(
    teamOwnerInfo: { email: string; id: string },
    subscription: Stripe.Subscription,
    previousAttributes?: Partial<Stripe.Subscription>,
  ) {
    const { eventProperties, profileAttributes } =
      createKlaviyoSubscriptionEventData({ teamOwnerInfo, subscription });

    if (subscription.status === "trialing" && !previousAttributes?.status) {
      await createKlaviyoServerEvent({
        eventName: "Trial Started",
        eventProperties,
        profileAttributes,
      });
    } else if (
      subscription.status === "active" &&
      previousAttributes?.status === "trialing"
    ) {
      await createKlaviyoServerEvent({
        eventName: "Trial Converted",
        eventProperties,
        profileAttributes,
        value: eventProperties.TotalPrice,
      });
      await createKlaviyoServerEvent({
        eventName: "Placed Order",
        eventProperties,
        profileAttributes,
        value: eventProperties.TotalPrice,
      });
    } else if (
      subscription.status === "active" &&
      !previousAttributes?.status
    ) {
      await createKlaviyoServerEvent({
        eventName: "Placed Order",
        eventProperties,
        profileAttributes,
        value: eventProperties.TotalPrice,
      });
    }

    if (
      subscription.cancel_at_period_end === true &&
      !previousAttributes?.cancel_at_period_end
    ) {
      await createKlaviyoServerEvent({
        eventName: "Subscription Cancellation Scheduled",
        eventProperties: {
          ...eventProperties,
          CancellationDate: new Date(
            subscription.cancel_at! * 1000,
          ).toISOString(),
          CurrentPeriodEnd: new Date(
            subscription.current_period_end * 1000,
          ).toISOString(),
        },
        profileAttributes: {
          ...profileAttributes,
        },
      });
    }
  }
}

function createKlaviyoSubscriptionEventData({
  teamOwnerInfo,
  subscription,
}: {
  teamOwnerInfo: { email: string; id: string };
  subscription: Stripe.Subscription;
}) {
  const price = subscription.items.data[0].price;
  const quantity = subscription.items.data[0].quantity || 1;
  const amount = (price.unit_amount || 0) * quantity;

  const productId =
    typeof subscription.items.data[0].price.product === "string"
      ? subscription.items.data[0].price.product
      : subscription.items.data[0].price.product.id;

  return {
    eventProperties: {
      TotalPrice: amount / 100,
      Currency: price.currency.toUpperCase(),
      Items: [
        {
          PlanName: getProductSlugFromId(productId),
          Price: (price.unit_amount || 0) / 100,
          Quantity: quantity,
        },
      ],
      ...(subscription.discount?.coupon
        ? { Coupon: subscription.discount.coupon.id }
        : {}),
    },
    profileAttributes: {
      email: teamOwnerInfo.email,
      id: teamOwnerInfo.id,
      SubscriptionStatus: subscription.status,
      OwnsATeam: true,
    },
  };
}
