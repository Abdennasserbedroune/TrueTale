import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome back, {session.user.name ?? session.user.email}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Track your profile status, drafts, and published works from one place.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Profile completeness</h2>
          <p className="mt-2 text-sm text-slate-600">
            {profile?.isOnboarded
              ? "Your profile is ready for discovery."
              : "Complete onboarding to make your profile shine."}
          </p>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Next steps</h2>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            <li>✔️ Secure authentication with session-based guards</li>
            <li>{profile ? "✔️" : "⬜"} Profile record provisioned via Prisma</li>
            <li>⬜ Draft your next piece</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
