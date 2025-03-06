export const serverConfig = {
  domain: process.env.DOMAIN ?? "",
  nodeEnv: process.env.NODE_ENV as
    | "production"
    | "staging"
    | "test"
    | "development",
  sessionSecret: process.env.SESSION_SECRET ?? "",
  betterstackLoggingSourceToken:
    process.env.BETTERSTACK_LOGGING_SOURCE_TOKEN ?? "",
  sendGridApiKey: process.env.SEND_GRID_KEY ?? "",
  emailOtpJwtSecret: process.env.EMAIL_OTP_JWT_SECRET ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  ipapiAccessKey: process.env.IPAPI_ACCESS_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  postmarkServerToken: process.env.POSTMARK_SERVER_TOKEN ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  googleMeasurementApiSecret: process.env.GOOGLE_MEASUREMENT_API_SECRET ?? "",
  klaviyoPrivateApiKey: process.env.KLAVIYO_PRIVATE_API_KEY ?? "",
};
