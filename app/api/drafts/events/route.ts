import { NextRequest } from "next/server";
import {
  DraftWorkspaceComment,
  DraftWorkspace,
  getDraftEventEmitter,
  getDraftWorkspace,
} from "@/lib/draftsStore";
import { currentUserId } from "@/lib/session";

export const runtime = "nodejs";

function resolveUserId(request: NextRequest): string {
  return request.headers.get("x-user-id") ?? currentUserId;
}

function writeEvent<T>(controller: ReadableStreamDefaultController<Uint8Array>, event: string, data: T) {
  const encoder = new TextEncoder();
  const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(payload));
}

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const draftId = searchParams.get("draftId");
  if (!draftId) {
    return new Response(JSON.stringify({ error: "draftId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const viewerId = resolveUserId(request);

  let initialDraft: DraftWorkspace;
  try {
    initialDraft = getDraftWorkspace(draftId, viewerId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open draft";
    const status = /authoris|authoriz/i.test(message) ? 403 : 400;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const emitter = getDraftEventEmitter();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;

      const sendDraftUpdate = (draft: DraftWorkspace) => {
        if (closed || draft.id !== draftId) return;
        writeEvent(controller, "draft", draft);
      };

      const sendComment = (payload: { draftId: string; comment: DraftWorkspaceComment }) => {
        if (closed || payload.draftId !== draftId) return;
        writeEvent(controller, "comment", payload.comment);
      };

      emitter.on("draft:updated", sendDraftUpdate);
      emitter.on("draft:commented", sendComment);

      writeEvent(controller, "ready", { ok: true });
      writeEvent(controller, "draft", initialDraft);

      const abort = () => {
        if (closed) return;
        closed = true;
        emitter.off("draft:updated", sendDraftUpdate);
        emitter.off("draft:commented", sendComment);
        controller.close();
      };

      request.signal.addEventListener("abort", abort);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
