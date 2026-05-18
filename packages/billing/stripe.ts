import Stripe from "stripe"

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!,
  { apiVersion: "2024-06-20" }
)

export const PLANS = {
  free: { limit: 100 },
  pro: { limit: 10000 },
  enterprise: { limit: Infinity }
}

export async function createCheckoutSession(email: string) {
  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{
      price: process.env.STRIPE_PRICE_ID!,
      quantity: 1
    }],
    customer_email: email,
    success_url: `${process.env.APP_URL}/dashboard`,
    cancel_url: `${process.env.APP_URL}/pricing`
  })
}
