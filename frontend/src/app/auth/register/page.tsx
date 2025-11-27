"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/auth";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"reader" | "writer" | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!selectedRole) {
      setError("Please select your role");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        email: formData.get("email") as string,
        username: formData.get("username") as string,
        password: formData.get("password") as string,
        role: selectedRole,
      };

      await register(data);

      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || "Registration failed");
      } else {
        setError("Registration failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a12] via-[#1a0a2e] to-[#0a0a12] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold tracking-tight inline-block mb-8 hover:opacity-80 transition-opacity">
            TrueTale
          </Link>
          <h2 className="text-4xl font-bold">
            Join TrueTale
          </h2>
          <p className="mt-3 text-white/60">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-neon-purple hover:text-neon-pink transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl backdrop-blur-sm">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-white/80">
              I want to...
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole("reader")}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${selectedRole === "reader"
                    ? "border-neon-purple bg-neon-purple/10 shadow-lg shadow-neon-purple/20"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
              >
                <div className="text-3xl mb-3">📚</div>
                <h3 className="text-xl font-bold mb-2">Read Stories</h3>
                <p className="text-sm text-white/60">
                  Discover and enjoy amazing stories from talented writers
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("writer")}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left ${selectedRole === "writer"
                    ? "border-neon-purple bg-neon-purple/10 shadow-lg shadow-neon-purple/20"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
              >
                <div className="text-3xl mb-3">✍️</div>
                <h3 className="text-xl font-bold mb-2">Write & Publish</h3>
                <p className="text-sm text-white/60">
                  Share your stories with readers and build your audience
                </p>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all"
                placeholder="your_username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-all"
                placeholder="Min 6 characters"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedRole}
            className="w-full py-3 px-4 bg-white text-black font-medium rounded-xl hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
