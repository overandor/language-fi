import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = ["/", "/waitlist", "/pricing"]

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  
  if (publicPaths.includes(path)) {
    return NextResponse.next()
  }
  
  const session = req.cookies.get("session")
  
  if (!session) {
    return NextResponse.redirect(new URL("/waitlist", req.url))
  }
  
  return NextResponse.next()
}
