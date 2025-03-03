import { Badge } from "@www/ui/badge";
import { Button } from "@www/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@www/ui/card";
import { Check } from "lucide-react";
import { type PricingTier } from "../utils/pricing-tiers";

export function CheckoutPricingCard({
  tier,
  hasCustomerUsedFreeTrial,
  onCheckout,
}: {
  tier: PricingTier;
  hasCustomerUsedFreeTrial: boolean;
  isCurrentPlan?: boolean;
  onCheckout: (planType: string, interval: "month" | "year") => void;
}) {
  const showFreeTrialText =
    tier.freeTrialAvailable && !hasCustomerUsedFreeTrial;
  return (
    <Card
      className={`relative ${tier.popular ? "border-primary shadow-lg" : ""}`}
    >
      {tier.popular && (
        <Badge className="bg-primary text-primary-foreground absolute -right-2 -top-2">
          Popular
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">${tier.price}</span>
          <span className="text-muted-foreground"> Monthly</span>
          <div className="text-muted-foreground text-sm">
            Or ${tier.annualPrice} Annually
          </div>
        </div>
      </CardHeader>
      <CardContent className="border-t">
        <ul className="mt-4 space-y-3">
          {tier.features.map((feature) => (
            <li
              key={feature.name}
              className={`flex items-center ${
                !feature.included ? "text-muted-foreground line-through" : ""
              }`}
            >
              <Check className="mr-2 h-4 w-4 flex-shrink-0" />
              {feature.name}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col">
        <>
          <Button
            className="mb-2 w-full"
            variant={tier.popular ? "default" : "outline"}
            onClick={() => onCheckout(tier.id, "month")}
          >
            Subscribe Monthly {showFreeTrialText ? "(Free Trial)" : null}
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => onCheckout(tier.id, "year")}
          >
            Subscribe Anually {showFreeTrialText ? "(Free Trial)" : null}
          </Button>
        </>
      </CardFooter>
    </Card>
  );
}

export function PortalPricingCard({
  tier,
  isCurrentPlan = false,
  onManageSubscription,
}: {
  tier: PricingTier;
  isCurrentPlan?: boolean;
  onManageSubscription: () => void;
}) {
  const showPopularBadge = tier.popular && !isCurrentPlan;
  return (
    <Card
      className={`relative ${showPopularBadge ? "border-primary shadow-lg" : ""}`}
    >
      {showPopularBadge && (
        <Badge className="bg-primary text-primary-foreground absolute -right-2 -top-2">
          Popular
        </Badge>
      )}
      {isCurrentPlan && (
        <Badge
          variant="default"
          className="bg-border text-foreground absolute -right-2 -top-2"
        >
          Current plan
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">${tier.price}</span>
          <span className="text-muted-foreground"> Monthly</span>
          <div className="text-muted-foreground text-sm">
            Or ${tier.annualPrice} Annually
          </div>
        </div>
      </CardHeader>
      <CardContent className="border-t">
        <ul className="mt-4 space-y-3">
          {tier.features.map((feature) => (
            <li
              key={feature.name}
              className={`flex items-center ${
                !feature.included ? "text-muted-foreground line-through" : ""
              }`}
            >
              <Check className="mr-2 h-4 w-4 flex-shrink-0" />
              {feature.name}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col">
        {isCurrentPlan ? (
          <Button className="w-full" variant="secondary" disabled>
            Current Plan
          </Button>
        ) : (
          <>
            <Button
              className="mb-2 w-full"
              variant={showPopularBadge ? "default" : "outline"}
              onClick={onManageSubscription}
            >
              {isCurrentPlan ? "Current Plan" : "Upgrade"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
