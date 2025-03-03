import { getPublicConfig } from "~/public-config";
import { useSubmit } from "react-router";
import { BillingRouteIntent } from "../billing-route";
import { CheckoutPricingCard } from "./pricing-card";
import { pricingTiers } from "../utils/pricing-tiers";
import { trackBeginCheckout } from "~/utils/analytics/core";

const config = getPublicConfig();

export function UnsubscribedView({
  hasCustomerUsedFreeTrial,
  userId,
  teamId,
}: {
  hasCustomerUsedFreeTrial: boolean;
  userId: string;
  teamId: string;
}) {
  const submit = useSubmit();

  const handleCheckout = (planType: string, interval: "month" | "year") => {
    const priceInfo =
      config.stripe.products[planType as keyof typeof config.stripe.products]
        .price[interval];

    const formData = new FormData();
    formData.append("intent", BillingRouteIntent.CREATE_CHECKOUT_SESSION);
    formData.append("priceId", priceInfo.id);
    formData.append("planType", planType.toLowerCase());
    formData.append("interval", interval);

    trackBeginCheckout({ userId, teamId, priceInfo, planType });

    submit(formData, { method: "POST" });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Billing</h2>
        <p className="text-muted-foreground">
          We offer a wide range of services to assist you in the land
          acquisition process. Select from the plans below to get started.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {pricingTiers.map((tier) => (
          <CheckoutPricingCard
            key={tier.id}
            tier={tier}
            hasCustomerUsedFreeTrial={hasCustomerUsedFreeTrial}
            onCheckout={handleCheckout}
          />
        ))}
      </div>
    </div>
  );
}
