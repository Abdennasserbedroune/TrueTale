import { NextRequest, NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/marketplaceService";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("stripe-signature") ?? undefined;
    const arrayBuffer = await request.arrayBuffer();
    const payload = Buffer.from(arrayBuffer);
    await handleStripeWebhook(payload, signature);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
