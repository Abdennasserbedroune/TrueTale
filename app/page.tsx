import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Build your TrueTale presence
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          TrueTale helps emerging and established writers craft their portfolio, stay close to their
          readers, and collaborate with trusted peers. Secure authentication, profile onboarding, and
          draft management ship with the foundations so you can focus on storytelling.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {session ? (
            <>
              <Link href="/dashboard" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-brand-500">
                Go to dashboard
              </Link>
              <Link href="/profile/edit" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Edit profile
              </Link>
            </>
          ) : (
            <>
              <Link href="/register" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-brand-500">
                Create an account
              </Link>
              <Link href="/login" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Writer identity",
            description:
              "Curated profile pages allow you to showcase bios, expertise, and the body of work you are proud of.",
          },
          {
            title: "Collaboration primitives",
            description:
              "Drafts, works, and feedback threads are modeled in Prisma so you can plug in collaborative flows fast.",
          },
          {
            title: "Commerce ready",
            description:
              "Purchases and file assets are represented to enable premium distribution, bundles, and gated releases.",
          },
        ].map((feature) => (
          <article key={feature.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
