import { NextResponse } from "next/server";
import { clearLoginSession } from "../../lib/auth";

export async function GET() {
  await clearLoginSession();
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}