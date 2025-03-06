import Stripe from "stripe";
import { serverConfig } from "~/config.server";

export const stripe = new Stripe(serverConfig.stripeSecretKey, {
  apiVersion: "2023-10-16",
});
