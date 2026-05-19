import Stripe from "stripe"
import { NextResponse } from "next/server"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

export async function POST(req: Request) {
  try {
    const { tier } = await req.json()
    
    const priceMap: Record<string, string> = {
      starter: process.env.STRIPE_PRO_PRICE_ID || "",
      pro: process.env.STRIPE_PRO_PRICE_ID || "",
      fund: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
      enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || ""
    }

    const priceId = priceMap[tier] || priceMap.pro

    if (!stripe || !process.env.NEXT_PUBLIC_APP_URL) {
      return NextResponse.json(
        {
          error: "Stripe is not configured. Set STRIPE_SECRET_KEY, STRIPE_PRO_PRICE_ID, STRIPE_ENTERPRISE_PRICE_ID, and NEXT_PUBLIC_APP_URL to enable checkout.",
        },
        { status: 501 }
      )
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "No Stripe price ID configured for the selected tier." },
        { status: 400 }
      )
    }

    const origin = new URL(process.env.NEXT_PUBLIC_APP_URL)

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        { price: priceId, quantity: 1 }
      ],
      success_url: `${origin.origin}/dashboard?checkout=success&tier=${tier}`,
      cancel_url: `${origin.origin}/pricing?checkout=cancelled`
    })

    return Response.json({ url: session.url })
  } catch (error: any) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
