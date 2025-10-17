"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const rawData = {
      email: (formData.get("email") as string | null) ?? "",
      password: (formData.get("password") as string | null) ?? "",
    };

    const parsed = loginSchema.safeParse(rawData);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Invalid credentials");
      return;
    }

    setIsSubmitting(true);
    const response = await signIn("credentials", {
      redirect: false,
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      callbackUrl: "/dashboard",
    });

    setIsSubmitting(false);

    if (response?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push(response?.url ?? "/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
