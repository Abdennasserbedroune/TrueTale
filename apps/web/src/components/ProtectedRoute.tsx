"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { me, User } from "@/lib/auth";

export function withAuth<P extends object>(
  Component: React.ComponentType<P & { user: User }>
): React.ComponentType<P> {
  return function Protected(props: P) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
      async function checkAuth() {
        try {
          const { user: currentUser } = await me();
          setUser(currentUser);
        } catch {
          router.push("/auth/login");
        } finally {
          setLoading(false);
        }
      }

      checkAuth();
    }, [router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    if (!user) return null;

    return <Component {...props} user={user} />;
  };
}
