import type { Route } from "./+types/accept-invite-route";
import { Button } from "@www/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@www/ui/card";
import {
  Form,
  useLoaderData,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  useNavigation,
} from "react-router";
import { useActionErrorToast } from "~/hooks/action.js";
import { type Logger } from "~/logging/index.js";
import { actionWithDefaultErrorHandling } from "~/utils/actions.server.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { requireCustomer } from "~/utils/auth/loaders.server.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import {
  throwActionErrorAndLog,
  throwNotFoundErrorResponseJsonAndLog,
} from "~/utils/response.server.js";
import { validateTeamInvite } from "~/utils/team-invite/actions.server.js";
import { requireValidCustomerInviteCode } from "~/utils/team-invite/loaders.server.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { validateTeamSlugRouteParam } from "~/utils/url/actions.server.js";
import { getRouteParamOrThrow } from "~/utils/url/core.server.js";
import { requireTeamFromSlug } from "~/utils/team/loaders.js";
import { teams, customers, subscriptions } from "@acme/database/schema";
import { validateTeamFromSlug } from "~/utils/team/actions.js";
import { TeamRepository } from "~/repositories/teams.server.js";
import { TeamMemberService } from "~/services/team-members.server.js";
import { CustomerService } from "~/services/customer.server.js";
import { CustomerRepository } from "~/repositories/customers.server.js";
import { validateTeamHasSubscription } from "~/utils/subscription/actions.server";
import { SubscriptionService } from "~/services/subscription.server";
import { SubscriptionRepository } from "~/repositories/subscriptions.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);

  const teamSlug = requireTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const inviteCode = getRouteParamOrThrow({
    params: args.params,
    param: "inviteCode",
    thrower: () => {
      throw throwNotFoundErrorResponseJsonAndLog({
        data: { message: "This invite code does not exist or has expired." },
        logInfo: {
          logger,
          event: "customer_team_invite_code_not_in_path",
        },
      });
    },
  });

  const team = await requireTeamFromSlug({
    teamSlug,
    logger,
    projection: {
      id: teams.id,
      slug: teams.slug,
      name: teams.name,
    },
  });

  await requireValidCustomerInviteCode({ team, inviteCode, logger });

  try {
    await requireCustomer({ args, logger, projection: { id: customers.id } });
  } catch (e) {
    const url = new URL(args.request.url);
    const currentPath = url.pathname + url.search;
    throw redirect(`/signup?returnTo=${encodeURIComponent(currentPath)}`);
  }

  return { teamName: team.name };
};

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const currentCustomer = await validateCustomer({
      args,
      logger,
      projection: { id: customers.id },
    });

    const teamSlug = validateTeamSlugRouteParam({
      params: args.params,
      logger,
    });

    const inviteCode = getRouteParamOrThrow({
      params: args.params,
      param: "inviteCode",
      thrower: () => {
        throw throwActionErrorAndLog({
          message: "This invite does not exist.",
          logInfo: {
            logger,
            data: { teamSlug, code: inviteCode },
            event: "customer_team_invite_code_not_in_path",
          },
        });
      },
    });

    const team = await validateTeamFromSlug({
      teamSlug,
      logger,
      projection: { id: teams.id, slug: teams.slug },
    });

    const teamInvite = await validateTeamInvite({
      team,
      inviteCode,
      logger,
    });

    const subscription = await validateTeamHasSubscription({
      teamId: team.id,
      projection: {
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        subscriptionItemId: subscriptions.subscriptionItemId,
        currentPeriodSeats: subscriptions.currentPeriodSeats,
      },
      errorMessage:
        "This team cannot be joined because they do not have an active subscription.",
      logger,
    });

    const teamMemberService = new TeamMemberService({
      logger,
      teamRepo: new TeamRepository(),
    });

    await teamMemberService.redeemInvite({
      teamInviteInfo: teamInvite,
      teamId: team.id,
      customerId: currentCustomer.id,
      customerService: new CustomerService({
        customerRepo: new CustomerRepository(),
        logger,
      }),
      subscription,
      subscriptionService: new SubscriptionService({
        teamRepo: new TeamRepository(),
        customerRepo: new CustomerRepository(),
        subscriptionRepo: new SubscriptionRepository(),
      }),
    });

    throw redirect(`/${teamSlug}`);
  },
);

export default function TeamJoin({ actionData }: Route.ComponentProps) {
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  useActionErrorToast(actionData);

  return (
    <div className="bg-base-100 flex h-screen flex-col items-center justify-center">
      <Card className="bg-base-200 mt w-full max-w-lg">
        <Form method="POST">
          <CardHeader>
            <CardTitle>Join {loaderData.teamName}</CardTitle>
            <CardDescription>
              You've been invited to join {loaderData.teamName}. To accept this
              invitation, click the button below.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-end">
            <Button loading={navigation.state !== "idle"}>Accept</Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
}
