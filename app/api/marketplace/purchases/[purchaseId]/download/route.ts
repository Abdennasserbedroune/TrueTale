import { NextRequest, NextResponse } from "next/server";
import { getPurchaseDownload } from "@/lib/marketplaceService";

export async function GET(request: NextRequest, { params }: { params: { purchaseId: string } }) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "token query parameter is required" }, { status: 400 });
    }

    const { asset, purchase, work } = getPurchaseDownload(params.purchaseId, token);

    return NextResponse.json({
      filename: asset.filename,
      contentType: asset.contentType,
      base64Data: asset.base64Data,
      downloadCount: purchase.downloadCount,
      work: {
        id: work.id,
        title: work.title,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to retrieve download";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
