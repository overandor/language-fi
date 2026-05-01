import { NextResponse } from "next/server"
import { z } from "zod"

const orderSchema = z.object({
  primitive: z.string(),
  side: z.enum(["long", "short"]),
  size: z.number().positive(),
  price: z.number().positive()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = orderSchema.parse(body)
    
    // TODO: Insert order into database
    // TODO: Call matcher.place()
    // TODO: Persist to DB
    
    return Response.json({ 
      status: "accepted",
      orderId: `order-${Date.now()}`
    })
  } catch (error: any) {
    console.error("Order placement error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
