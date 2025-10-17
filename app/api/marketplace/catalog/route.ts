import { NextResponse } from "next/server";
import { listCatalogue } from "@/lib/marketplaceService";

export async function GET() {
  const works = listCatalogue();
  return NextResponse.json({ works });
}
