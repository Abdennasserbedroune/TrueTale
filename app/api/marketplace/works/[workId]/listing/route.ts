import { NextRequest, NextResponse } from "next/server";
import { updateListing } from "@/lib/marketplaceService";

export async function PUT(request: NextRequest, { params }: { params: { workId: string } }) {
  try {
    const body = await request.json();
    const { title, synopsis, tags, priceCents, inventory } = body ?? {};

    if (!title || !synopsis || !Array.isArray(tags) || typeof priceCents !== "number") {
      return NextResponse.json(
        { error: "title, synopsis, tags, and priceCents are required" },
        { status: 400 },
      );
    }

    const work = updateListing(params.workId, {
      title,
      synopsis,
      tags,
      priceCents,
      inventory: inventory ?? null,
    });

    return NextResponse.json({ work });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update listing";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
