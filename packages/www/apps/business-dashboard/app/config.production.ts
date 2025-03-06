export const config = {
  cloudinaryCloudName: "example-cloud",
  cloudinaryApiKey: "123456789012345",
  environment: "development",
  klaviyo: {
    publicApiKey: "ABCDEF",
  },
  stripe: {
    paymentMethodConfigId: "pmc_example123456789abcdef",
    trialDays: 7,
    products: {
      basic: {
        id: "prod_example123456",
        slug: "basic",
        name: "Basic",
        price: {
          month: { id: "price_example123month", amount: 9.99 },
          year: { id: "price_example123year", amount: 99.99 },
        },
      },
      standard: {
        id: "prod_example789012",
        slug: "standard",
        name: "Standard",
        price: {
          month: { id: "price_example456month", amount: 19.99 },
          year: { id: "price_example456year", amount: 199.99 },
        },
      },
      premium: {
        id: "prod_example345678",
        slug: "premium",
        name: "Premium",
        price: {
          month: { id: "price_example789month", amount: 29.99 },
          year: { id: "price_example789year", amount: 299.99 },
        },
      },
    },
    publicKey: "pk_test_example123456789abcdefghijklmnopqrstuvwxyz",
  },
} as const;