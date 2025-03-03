declare global {
  interface Window {
    _learnq: any[];
  }
}

interface KlaviyoSubscriptionItem {
  PlanName: string;
  Price: number;
  Quantity: number;
  [key: string]: unknown;
}

type KlaviyoSubscriptionParams = {
  TotalPrice: number;
  Currency: string;
  Items: KlaviyoSubscriptionItem[];
  Coupon?: string;
};

type KlaviyoScheduledSubscriptionCancellationParams = {
  CancellationDate: string;
  CurrentPeriodEnd: string;
};

type KlaviyoProfileAttributes = {
  email: string;
  id: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  city?: string;
  country?: string;
};

export type KlaviyoEvent =
  | {
      name: "Checkout Started";
      eventProperties: KlaviyoSubscriptionParams;
      profileAttributes: KlaviyoProfileAttributes;
    }
  | {
      name: "Trial Started";
      eventProperties: KlaviyoSubscriptionParams;
      profileAttributes: KlaviyoProfileAttributes & {
        SubscriptionStatus: string;
      };
    }
  | {
      name: "Trial Converted";
      eventProperties: KlaviyoSubscriptionParams;
      profileAttributes: KlaviyoProfileAttributes & {
        SubscriptionStatus: string;
      };
    }
  | {
      name: "Placed Order";
      eventProperties: KlaviyoSubscriptionParams;
      profileAttributes: KlaviyoProfileAttributes & {
        SubscriptionStatus: string;
      };
    }
  | {
      name: "Subscription Cancellation Scheduled";
      eventProperties: KlaviyoSubscriptionParams &
        KlaviyoScheduledSubscriptionCancellationParams;
      profileAttributes: KlaviyoProfileAttributes & {
        SubscriptionStatus: string;
      };
    }
  | {
      name: "Subscription Cancelled";
      eventProperties: KlaviyoSubscriptionParams &
        KlaviyoScheduledSubscriptionCancellationParams;
      profileAttributes: KlaviyoProfileAttributes & {
        SubscriptionStatus: string;
      };
    }
  | {
      name: "Welcome Flow Completed";
      eventProperties: { UserJobRole: string };
      profileAttributes: KlaviyoProfileAttributes & { UserJobRole: string };
    };

export type KlaviyoIdentifyProps = {
  $id?: string;
  $first_name?: string;
  $last_name?: string;
  $phone_number?: string;
  $city?: string;
  $country?: string;
  [key: string]: unknown;
};
