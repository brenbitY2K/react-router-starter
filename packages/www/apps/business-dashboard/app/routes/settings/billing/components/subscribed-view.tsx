import type { Info } from "../+types/billing-route";
import { Alert, AlertTitle, AlertDescription } from "@www/ui/alert";
import { Badge } from "@www/ui/badge";
import { Button } from "@www/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@www/ui/card";
import { Form, useSubmit } from "react-router";
import { BillingRouteIntent } from "../billing-route";
import { PortalPricingCard } from "./pricing-card";
import { pricingTiers } from "../utils/pricing-tiers";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@www/ui/tooltip";
import { InfoIcon } from "lucide-react";

const StatusBadgeMap = {
  active: { label: "Active", className: "bg-success text-white" },
  trialing: { label: "Trial", className: "bg-primary text-white" },
  past_due: {
    label: "Past Due",
    className: "bg-warning text-warning-foreground",
  },
  canceled: { label: "Canceled", className: "bg-muted text-muted-foreground" },
  incomplete: {
    label: "Incomplete",
    className: "bg-destructive text-destructive-foreground",
  },
  incomplete_expired: {
    label: "Expired",
    className: "bg-destructive text-destructive-foreground",
  },
  unpaid: {
    label: "Unpaid",
    className: "bg-destructive text-destructive-foreground",
  },
  paused: { label: "Paused", className: "bg-warning text-warning-foreground" },
};

const tierOrder = {
  contractor: 0,
  acquisition: 1,
  rezoning: 2,
};

export function SubscribedView({
  subscription,
}: {
  subscription: NonNullable<Info["loaderData"]["subscription"]>;
}) {
  const submit = useSubmit();
  const currentTierIndex =
    tierOrder[subscription.plan as keyof typeof tierOrder];

  const handlePortalReroute = () => {
    const formData = new FormData();
    formData.append("intent", BillingRouteIntent.CREATE_PORTAL_SESSION);
    submit(formData, { method: "POST" });
  };

  const statusInfo = StatusBadgeMap[
    subscription.status as keyof typeof StatusBadgeMap
  ] || {
    label: subscription.status,
    className: "bg-muted text-muted-foreground",
  };

  const capitalizedPlan =
    subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1);

  const billingInterval =
    subscription.billingInterval === "month"
      ? "Monthly"
      : subscription.billingInterval === "year"
        ? "Yearly"
        : "Unknown";

  return (
    <div className="space-y-8">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle className="flex items-center justify-between">
              Current Subscription
            </CardTitle>
            <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
          </div>
          <CardDescription>
            {subscription.status === "trialing" &&
              "Your trial is currently active"}
            {subscription.status === "active" && "Your subscription is active"}
            {subscription.status === "paused" &&
              "Your subscription is temporarily paused"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-muted-foreground text-sm font-medium">
                Plan
              </span>
              <p className="font-medium">{capitalizedPlan}</p>
            </div>
            <div className="space-y-2">
              <span className="text-muted-foreground text-sm font-medium">
                Billing interval
              </span>
              <p className="font-medium">{billingInterval}</p>
            </div>
            <div className="space-y-2">
              <span className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                Seats
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="text-muted-foreground h-4 w-4 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[350px]">
                      <p>
                        A seat represents one team member who can access your
                        workspace. You'll be billed based on your total number
                        of seats.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              <div>{subscription.seats}</div>
            </div>{" "}
            <div className="space-y-2">
              <span className="text-muted-foreground text-sm font-medium">
                Next Billing Date
              </span>
              <p className="font-medium">
                {new Date(subscription.nextBillingDate).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  },
                )}
              </p>
            </div>
          </div>

          {subscription.status === "past_due" && (
            <Alert variant="destructive">
              <AlertTitle>Payment Past Due</AlertTitle>
              <AlertDescription>
                Your payment is past due. Please update your payment information
                to avoid service interruption.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          <Form method="post">
            <input
              type="hidden"
              name="intent"
              value={BillingRouteIntent.CREATE_PORTAL_SESSION}
            />
            <Button type="submit" className="w-full">
              Manage Current Subscription
            </Button>
          </Form>
        </CardFooter>
      </Card>
      {currentTierIndex < 2 && (
        <div>
          <h2 className="mb-6 text-center text-2xl font-bold">
            Available Upgrades
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {pricingTiers
              .filter((_, index) => index >= currentTierIndex)
              .map((tier) => (
                <PortalPricingCard
                  key={tier.id}
                  tier={tier}
                  isCurrentPlan={tier.id === subscription.plan}
                  onManageSubscription={handlePortalReroute}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
