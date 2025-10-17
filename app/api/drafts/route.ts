import { NextRequest, NextResponse } from "next/server";
import {
  DraftAttachmentInput,
  DraftCreationInput,
  createDraft,
  listAccessibleDrafts,
  listDraftBucketsForUser,
} from "@/lib/draftsStore";
import { currentUserId } from "@/lib/session";

export const runtime = "nodejs";

function resolveUserId(request: NextRequest): string {
  return request.headers.get("x-user-id") ?? currentUserId;
}

function parseSharedWith(raw: unknown): string[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    return raw.map((entry) => entry.toString());
  }
  if (typeof raw === "string") {
    if (!raw.trim()) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => entry.toString());
      }
    } catch (error) {
      // ignore and fall through
    }
    return raw.split(",").map((entry) => entry.trim()).filter(Boolean);
  }
  return undefined;
}

async function fileToAttachmentInput(file: File): Promise<DraftAttachmentInput> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    size: file.size ?? buffer.byteLength,
    base64Data: buffer.toString("base64"),
  } satisfies DraftAttachmentInput;
}

async function buildDraftInputFromForm(
  formData: FormData,
  ownerId: string,
): Promise<DraftCreationInput> {
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const attachments: DraftAttachmentInput[] = [];
  for (const file of files) {
    attachments.push(await fileToAttachmentInput(file));
  }

  return {
    ownerId,
    title: (formData.get("title") ?? "Untitled draft").toString(),
    content: (formData.get("content") ?? "").toString(),
    visibility: (formData.get("visibility") ?? undefined)?.toString() as DraftCreationInput["visibility"],
    sharedWith: parseSharedWith(formData.getAll("sharedWith")) ?? parseSharedWith(formData.get("sharedWith")),
    attachments,
    note: (formData.get("note") ?? undefined)?.toString(),
  } satisfies DraftCreationInput;
}

export async function GET(request: NextRequest) {
  const viewerId = resolveUserId(request);
  const drafts = listAccessibleDrafts(viewerId);
  const buckets = listDraftBucketsForUser(viewerId);
  return NextResponse.json({ drafts, buckets });
}

export async function POST(request: NextRequest) {
  const ownerId = resolveUserId(request);

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let draftInput: DraftCreationInput;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      draftInput = await buildDraftInputFromForm(formData, ownerId);
    } else {
      const body = await request.json();
      draftInput = {
        ownerId,
        title: body.title ?? "Untitled draft",
        content: body.content ?? "",
        visibility: body.visibility,
        sharedWith: parseSharedWith(body.sharedWith),
        attachments: Array.isArray(body.attachments) ? body.attachments : [],
        note: body.note,
      } satisfies DraftCreationInput;
    }

    const draft = createDraft(draftInput);
    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    console.error("Failed to create draft", error);
    return NextResponse.json({ error: "Unable to create draft" }, { status: 400 });
  }
}
