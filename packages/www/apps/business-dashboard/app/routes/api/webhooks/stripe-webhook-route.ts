import { stripe } from "~/lib/stripe.server";
import type Stripe from "stripe";
import { serverConfig } from "~/config.server";
import { SubscriptionRepository } from "~/repositories/subscriptions.server";
import { TeamRepository } from "~/repositories/teams.server";
import { actionWithDefaultErrorHandling } from "~/utils/actions.server";
import { type ActionFunctionArgs } from "react-router";
import { logErrorEvent, type Logger } from "~/logging";
import { SubscriptionWebhookService } from "~/services/subscription-webhook.server";
import { CustomerRepository } from "~/repositories/customers.server";
import { UserRepository } from "~/repositories/users.server";

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    if (args.request.method !== "POST") {
      return Response.json({ message: "Method not allowed" }, { status: 405 });
    }

    const payload = await args.request.clone().text();
    const signature = args.request.headers.get("stripe-signature");

    if (!signature) {
      return Response.json({ message: "No signature found" }, { status: 401 });
    }

    const subscriptionService = new SubscriptionWebhookService({
      subscriptionRepo: new SubscriptionRepository(),
      customerRepo: new CustomerRepository(),
      teamRepo: new TeamRepository(),
      userRepo: new UserRepository(),
      logger,
    });

    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        serverConfig.stripeWebhookSecret,
      );

      if (
        event.type === "customer.subscription.created" ||
        event.type === "customer.subscription.updated"
      ) {
        await subscriptionService.handleCreateOrUpdateWebhookEvent(
          event.data.object as Stripe.Subscription,
          event.data.previous_attributes,
        );
      } else if (event.type === "customer.subscription.deleted") {
        await subscriptionService.handleDeleteSubscriptionWebhookEvent(
          event.data.object as Stripe.Subscription,
        );
      }

      return Response.json({ success: true }, { status: 200 });
    } catch (err) {
      logErrorEvent(logger, "stripe_error", err);
      if (
        err instanceof Error ||
        (typeof err === "object" && err && "message" in err)
      ) {
        return Response.json({ message: err.message }, { status: 500 });
      }
      return Response.json(
        { message: "An unknown error occurred" },
        { status: 500 },
      );
    }
  },
);
