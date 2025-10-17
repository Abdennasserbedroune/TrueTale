import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { uploadAvatar } from "@/lib/storage";

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "Avatar file missing" }, { status: 400 });
    }

    const url = await uploadAvatar(file);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Avatar upload error", error);
    return NextResponse.json({ message: "Unable to upload avatar" }, { status: 500 });
  }
}
