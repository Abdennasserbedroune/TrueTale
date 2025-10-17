import { NextRequest, NextResponse } from "next/server";
import {
  DraftAttachmentInput,
  DraftUpdateInput,
  deleteDraft,
  getDraftWorkspace,
  updateDraft,
} from "@/lib/draftsStore";
import { currentUserId } from "@/lib/session";

export const runtime = "nodejs";

function resolveUserId(request: NextRequest): string {
  return request.headers.get("x-user-id") ?? currentUserId;
}

function parseList(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.map((entry) => entry.toString());
  }
  if (typeof value === "string") {
    if (!value.trim()) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => entry.toString());
      }
    } catch (error) {
      // swallow, fallback
    }
    return value.split(",").map((entry) => entry.trim()).filter(Boolean);
  }
  return undefined;
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "string") {
    return value === "true" || value === "1" || value === "on";
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return false;
}

async function toAttachmentInputs(entries: FormDataEntryValue[]): Promise<DraftAttachmentInput[]> {
  const files = entries.filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const attachments: DraftAttachmentInput[] = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    attachments.push({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size ?? buffer.byteLength,
      base64Data: buffer.toString("base64"),
    });
  }
  return attachments;
}

async function buildUpdateInputFromForm(formData: FormData): Promise<DraftUpdateInput> {
  const attachmentsToAdd = await toAttachmentInputs(formData.getAll("files"));
  return {
    title: (formData.get("title") ?? undefined)?.toString(),
    content: (formData.get("content") ?? undefined)?.toString(),
    visibility: (formData.get("visibility") ?? undefined)?.toString() as DraftUpdateInput["visibility"],
    sharedWith: parseList(formData.getAll("sharedWith")) ?? parseList(formData.get("sharedWith")),
    attachmentsToAdd: attachmentsToAdd.length > 0 ? attachmentsToAdd : undefined,
    removeAttachmentIds: parseList(formData.getAll("removeAttachmentIds")) ?? parseList(formData.get("removeAttachmentIds")),
    autosave: parseBoolean(formData.get("autosave")),
    note: (formData.get("note") ?? undefined)?.toString(),
  } satisfies DraftUpdateInput;
}

function normaliseUpdateBody(body: any): DraftUpdateInput {
  return {
    title: typeof body.title === "string" ? body.title : undefined,
    content: typeof body.content === "string" ? body.content : undefined,
    visibility: body.visibility,
    sharedWith: parseList(body.sharedWith),
    attachmentsToAdd: Array.isArray(body.attachmentsToAdd) ? body.attachmentsToAdd : undefined,
    removeAttachmentIds: parseList(body.removeAttachmentIds),
    autosave: parseBoolean(body.autosave),
    note: typeof body.note === "string" ? body.note : undefined,
  } satisfies DraftUpdateInput;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status = /authoris|authoriz|Not authorised/i.test(message) ? 403 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const viewerId = resolveUserId(request);
    const draft = getDraftWorkspace(params.id, viewerId);
    return NextResponse.json({ draft });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const actorId = resolveUserId(request);
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let updateInput: DraftUpdateInput;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      updateInput = await buildUpdateInputFromForm(formData);
    } else {
      const body = await request.json();
      updateInput = normaliseUpdateBody(body);
    }

    const draft = updateDraft(params.id, actorId, updateInput);
    return NextResponse.json({ draft });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const actorId = resolveUserId(request);
  try {
    deleteDraft(params.id, actorId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
