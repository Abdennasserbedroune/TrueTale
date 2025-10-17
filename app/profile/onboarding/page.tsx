import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfileOnboardingPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  if (profile?.isOnboarded) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Introduce yourself to readers</h1>
        <p className="text-sm text-slate-600">
          Share your voice, highlight what you love to write, and set the tone for future work.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <ProfileForm
          initialData={profile ?? undefined}
          mode="onboarding"
        />
      </div>
    </div>
  );
}
