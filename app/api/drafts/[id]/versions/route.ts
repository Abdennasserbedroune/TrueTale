import { NextRequest, NextResponse } from "next/server";
import { listDraftRevisions } from "@/lib/draftsStore";
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
  try {
    const viewerId = resolveUserId(request);
    const revisions = listDraftRevisions(params.id, viewerId);
    return NextResponse.json({ revisions });
  } catch (error) {
    return errorResponse(error);
  }
}
