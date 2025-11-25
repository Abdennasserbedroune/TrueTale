import { NextRequest, NextResponse } from "next/server";
import { uploadAsset } from "@/lib/marketplaceService";

export async function POST(request: NextRequest, { params }: { params: Promise<{ workId: string }> }) {
  try {
    const { workId } = await params;
    const body = await request.json();
    const { filename, contentType, base64Data } = body ?? {};

    if (!filename || !contentType || !base64Data) {
      return NextResponse.json(
        { error: "filename, contentType, and base64Data are required" },
        { status: 400 }
      );
    }

    const asset = uploadAsset(workId, { filename, contentType, base64Data });
    const { base64Data: _discarded, ...exposed } = asset;
    return NextResponse.json({ asset: exposed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload asset";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
