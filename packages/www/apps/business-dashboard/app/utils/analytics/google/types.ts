declare global {
  interface Window {
    gtag: (
      command: string,
      target: string,
      config?: Record<string, unknown>,
    ) => void;
    dataLayer: any[];
  }
}

interface GA4Item {
  // Required fields (at least one of item_id or item_name must be present)
  item_id: string;
  item_name?: string;

  // Optional fields
  affiliation?: string; // Product affiliation (e.g., "Google Store")
  coupon?: string;
  discount?: number;
  price?: number;
  quantity?: number;

  [key: string]: string | number | undefined;
}

type ChargeableEventParams = {
  currency: string;
  value: number;
  items: GA4Item[];

  coupon?: string;
};

type PurchaseEventParams = ChargeableEventParams & { transaction_id: string };

type UserAndTeamTrackingParams = {
  user_id: string;
  team_id: string;
};

type UserTrackingParams = {
  user_id: string;
};

type AuthParams = {
  method: "google" | "email";
};

export type GoogleEvent =
  | {
      name: "begin_checkout";
      params: ChargeableEventParams & UserAndTeamTrackingParams;
    }
  | {
      name: "trial_started";
      params: ChargeableEventParams & UserAndTeamTrackingParams;
    }
  | {
      name: "trial_converted";
      params: ChargeableEventParams & UserAndTeamTrackingParams;
    }
  | { name: "purchase"; params: PurchaseEventParams & UserTrackingParams }
  | { name: "sign_up"; params: AuthParams }
  | {
      name: "completed_welcome_flow";
      params: { user_job_role: string } & UserTrackingParams;
    };
