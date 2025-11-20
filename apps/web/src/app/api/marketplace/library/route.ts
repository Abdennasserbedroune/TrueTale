import { NextRequest, NextResponse } from "next/server";
import { getBuyerLibrary } from "@/lib/marketplaceService";

export async function GET(request: NextRequest) {
  const buyerEmail = request.nextUrl.searchParams.get("buyerEmail");
  if (!buyerEmail) {
    return NextResponse.json({ error: "buyerEmail is required" }, { status: 400 });
  }

  const library = getBuyerLibrary(buyerEmail);
  return NextResponse.json({ library });
}
