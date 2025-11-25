import { NextRequest, NextResponse } from "next/server";
import { publishListing } from "@/lib/marketplaceService";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ workId: string }> }) {
  try {
    const { workId } = await params;
    const work = publishListing(workId);
    return NextResponse.json({ work });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish work";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
