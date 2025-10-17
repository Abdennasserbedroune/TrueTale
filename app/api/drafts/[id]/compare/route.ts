import { NextRequest, NextResponse } from "next/server";
import { compareDraftRevisions } from "@/lib/draftsStore";
import { currentUserId } from "@/lib/session";

export const runtime = "nodejs";

function resolveUserId(request: NextRequest): string {
  return request.headers.get("x-user-id") ?? currentUserId;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status = /authoris|authoriz/i.test(message) ? 403 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const viewerId = resolveUserId(request);
  const searchParams = new URL(request.url).searchParams;
  const base = searchParams.get("base");
  const target = searchParams.get("target");
  if (!base || !target) {
    return NextResponse.json({ error: "base and target revision ids are required" }, { status: 400 });
  }
  try {
    const comparison = compareDraftRevisions(params.id, base, target, viewerId);
    return NextResponse.json({ comparison });
  } catch (error) {
    return errorResponse(error);
  }
}
