import { NextRequest, NextResponse } from "next/server";
import { createDraftComment, listDraftComments } from "@/lib/draftsStore";
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
    const userId = resolveUserId(request);
    const comments = listDraftComments(params.id, userId);
    return NextResponse.json({ comments });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const actorId = resolveUserId(request);
  try {
    const body = await request.json();
    const placement = body.placement === "inline" ? "inline" : "sidebar";
    const comment = createDraftComment(params.id, actorId, {
      body: body.body ?? "",
      placement,
      quote: body.quote ?? null,
    });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
