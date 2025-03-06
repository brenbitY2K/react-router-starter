export interface PricingTier {
  name: string;
  id: string;
  price: number;
  annualPrice: number;
  features: PricingFeature[];
  popular?: boolean;
  buttonText: string;
  buttonNote: string;
  freeTrialAvailable?: boolean;
}

export interface PricingFeature {
  name: string;
  included: boolean;
}

export const pricingTiers: PricingTier[] = [
  {
    name: "Contractor",
    id: "contractor",
    price: 50,
    annualPrice: 500,
    buttonText: "START 7 DAY TRIAL",
    buttonNote: "- Requires Account Creation\n- No Credit Card Required",
    freeTrialAvailable: true,
    features: [
      { name: "Off-Market Properties", included: true },
      { name: "New Construction Permits", included: true },
      { name: "Contact Phone Numbers", included: true },
      { name: "Contact Email Addresses", included: true },
      { name: "Interactive Map w/ Filters", included: true },
      { name: "Pre-Identified Leads", included: true },
      { name: "Save Projects", included: true },
      { name: "Project Management", included: true },
      { name: "AI Assistant", included: true },
      { name: "Email Notifications", included: true },
      { name: "Download to CSV / Excel", included: true },
      { name: "Statewide Parcels", included: false },
      { name: "Demographic Report", included: false },
      { name: "County vs. Zip Report", included: false },
      { name: "Future Land Use", included: false },
      { name: "Re-Zoning Applications", included: false },
    ],
  },
  {
    name: "Acquisition",
    id: "acquisition",
    price: 100,
    annualPrice: 1000,
    freeTrialAvailable: true,
    popular: true,
    buttonText: "START 7 DAY TRIAL",
    buttonNote: "- Requires Account Creation\n- No Credit Card Required",
    features: [
      { name: "Off-Market Properties", included: true },
      { name: "New Construction Permits", included: true },
      { name: "Contact Phone Numbers", included: true },
      { name: "Contact Email Addresses", included: true },
      { name: "Interactive Map w/ Filters", included: true },
      { name: "Pre-Identified Leads", included: true },
      { name: "Save Projects", included: true },
      { name: "Project Management", included: true },
      { name: "AI Assistant", included: true },
      { name: "Email Notifications", included: true },
      { name: "Download to CSV / Excel", included: true },
      { name: "Statewide Parcels", included: true },
      { name: "Demographic Reports", included: true },
      { name: "County vs. Zip Report", included: true },
      { name: "Future Land Use", included: true },
      { name: "Re-Zoning Applications", included: false },
    ],
  },
  {
    name: "Re-Zoning",
    id: "rezoning",
    price: 175,
    annualPrice: 1750,
    freeTrialAvailable: false,
    buttonText: "SCHEDULE DEMO",
    buttonNote: "- Free Trial Not Available\n- Schedule Demo to Learn More",
    features: [
      { name: "Off-Market Properties", included: true },
      { name: "New Construction Permits", included: true },
      { name: "Contact Phone Numbers", included: true },
      { name: "Contact Email Addresses", included: true },
      { name: "Interactive Map w/ Filters", included: true },
      { name: "Pre-Identified Leads", included: true },
      { name: "Save Projects", included: true },
      { name: "Project Management", included: true },
      { name: "AI Assistant", included: true },
      { name: "Email Notifications", included: true },
      { name: "Download to CSV / Excel", included: true },
      { name: "Statewide Parcels", included: true },
      { name: "Demographic Reports", included: true },
      { name: "County vs. Zip Report", included: true },
      { name: "Future Land Use", included: true },
      { name: "Re-Zoning Applications", included: true },
    ],
  },
];
