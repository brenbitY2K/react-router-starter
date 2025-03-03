import { type SubscriptionPlan, getPublicConfig } from "~/public-config";

const config = getPublicConfig();

export function getProductIdFromPriceId(priceId: string): string {
  const product = Object.values(config.stripe.products).find(
    (product) =>
      product.price.month.id === priceId || product.price.year.id === priceId,
  );

  if (!product) {
    throw new Error(`Your subscription is invalid. Please contact support.`);
  }

  return product.id;
}

export function getProductSlugFromId(productId: string) {
  const products = config.stripe.products;
  const product = Object.values(products).find((p) => p.id === productId);

  if (!product) {
    throw new Error(`Your subscription is invalid. Please contact support.`);
  }

  return product.slug as SubscriptionPlan;
}

export function getPriceAmount(productSlug: SubscriptionPlan, priceId: string) {
  const products = config.stripe.products;
  const product = products[productSlug];

  if (product.price.month.id === priceId) {
    return product.price.month.amount;
  }
  if (product.price.year.id === priceId) {
    return product.price.year.amount;
  }

  throw new Error(`Your subscription is invalid. Please contact support.`);
}
