import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = profileUpdateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid profile data" }, { status: 400 });
    }

    const { displayName, bio, location, website, genres, avatarUrl } = parsed.data;

    const profile = await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        displayName,
        bio: bio ?? null,
        location: location ?? null,
        website: website ?? null,
        genres: genres ?? [],
        avatarUrl: avatarUrl ?? null,
        isOnboarded: true,
      },
      create: {
        userId: session.user.id,
        displayName,
        bio: bio ?? null,
        location: location ?? null,
        website: website ?? null,
        genres: genres ?? [],
        avatarUrl: avatarUrl ?? null,
        isOnboarded: true,
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: displayName,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile update error", error);
    return NextResponse.json({ message: "Unexpected error" }, { status: 500 });
  }
}
