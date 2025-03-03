import type { Route, Info } from "./+types/billing-callback-route";
import { customers, teams } from "@acme/database/schema";
import { Dialog, DialogContent } from "@www/ui/dialog";
import { Suspense, useEffect } from "react";
import {
  Await,
  type LoaderFunctionArgs,
  useAsyncError,
  useNavigate,
  useSearchParams,
} from "react-router";
import LoadingSpinner from "~/components/loading-spinner";
import { requireCustomer } from "~/utils/auth/loaders.server";
import { createLoaderLogger } from "~/utils/loaders.server";
import { requireCustomerWithRole } from "~/utils/permissions/loaders.server";
import { requireTeamFromSlug } from "~/utils/team/loaders";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server";
import { pollSubscriptionStatus } from "./utils/subscription-polling";
import { trackGA4Event } from "~/utils/analytics/google/ga4";
import { trackTrialStarted } from "~/utils/analytics/core";

export async function loader(args: LoaderFunctionArgs) {
  const logger = createLoaderLogger(args);

  const customer = await requireCustomer({
    args,
    logger,
    projection: { id: customers.id, userId: customers.userId },
  });

  const teamSlug = requireTeamSlugRouteParam({ params: args.params, logger });

  const team = await requireTeamFromSlug({
    teamSlug,
    logger,
    projection: {
      id: teams.id,
    },
  });

  await requireCustomerWithRole({
    customerId: customer.id,
    teamId: team.id,
    role: "owner",
    logger,
    errorMessage: "You don't have permission to view billing information",
  });

  return {
    subscription: pollSubscriptionStatus({ teamId: team.id, attempts: 0 }),
    userData: { userId: customer.userId, teamId: team.id },
  };
}

function ErrorBoundary() {
  const error = useAsyncError();
  return (
    <div className="flex">
      <div>
        <h3 className="text-destructive text-md font-medium">
          An error occurred
        </h3>
        <p className="text-muted-foreground mt-2 text-sm">
          {error instanceof Error
            ? error.message
            : "An unknown error occurred."}
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          Please check back in a few minutes. If you're still not seeing your
          subscription, please contact support.
        </p>
      </div>
    </div>
  );
}

function SubscriptionSuccess({
  teamSlug,
  userData,
  subscription,
}: {
  teamSlug: string;
  userData: { userId: string; teamId: string };
  subscription: Awaited<Info["loaderData"]["subscription"]>;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (subscription.status === "trialing") {
      trackTrialStarted(subscription, userData);
    }

    if (subscription.status === "active") {
      trackGA4Event("purchase", {
        ...createGA4EventParams(subscription, userData),
        transaction_id: sessionId ?? "unknown_transaction_id",
      });
    }
    navigate(`/${teamSlug}/settings/billing`);
  }, [navigate, teamSlug, subscription, userData, sessionId]);

  return null;
}

export default function BillingCallbackRoute({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { subscription } = loaderData;

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <div>
          <Suspense
            fallback={
              <div className="flex">
                <div>
                  <div className="flex">
                    <h3 className="text-primary text-md mr-2 font-medium">
                      Confirming your subscription...
                    </h3>
                    <LoadingSpinner size="sm" />
                  </div>
                  <div className="text-muted-foreground mb-2 mt-2 text-sm">
                    Please wait while we verify your subscription.
                  </div>
                </div>
              </div>
            }
          >
            <Await resolve={subscription} errorElement={<ErrorBoundary />}>
              {(subscription) => (
                <SubscriptionSuccess
                  teamSlug={params.teamSlug}
                  subscription={subscription}
                  userData={loaderData.userData}
                />
              )}
            </Await>
          </Suspense>
        </div>
        <div className="mt-4 space-y-4"></div>
      </DialogContent>
    </Dialog>
  );
}

function createGA4EventParams(
  subscription: Awaited<Info["loaderData"]["subscription"]>,
  userData: { userId: string; teamId: string },
) {
  return {
    user_id: userData.userId,
    team_id: userData.teamId,
    currency: "USD",
    value: subscription.amount,
    items: [
      {
        item_id: subscription.priceId,
        item_name: subscription.plan,
        price: subscription.amount,
        quantity: 1,
      },
    ],
  };
}
