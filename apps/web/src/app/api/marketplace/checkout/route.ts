import { NextRequest, NextResponse } from "next/server";
import { startCheckoutSession } from "@/lib/marketplaceService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workId, buyerEmail } = body ?? {};

    if (!workId || !buyerEmail) {
      return NextResponse.json({ error: "workId and buyerEmail are required" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const successUrl = `${origin}/library?checkout=success`;
    const cancelUrl = `${origin}/marketplace?checkout=cancelled`;

    const session = await startCheckoutSession({
      workId,
      buyerEmail,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      checkoutSessionId: session.checkoutSessionId,
      checkoutUrl: session.checkoutUrl,
      purchase: session.purchase,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start checkout";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
