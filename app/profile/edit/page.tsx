import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfileEditPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  let profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId: session.user.id,
        displayName: session.user.name ?? "New writer",
        bio: "",
        genres: [],
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Edit your profile</h1>
        <p className="text-sm text-slate-600">
          Update your bio, spotlight new work, and keep readers informed about what you&apos;re building.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <ProfileForm initialData={profile} mode="edit" />
      </div>
    </div>
  );
}
