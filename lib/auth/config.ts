import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validators";

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { profile: true },
        });

        if (!user) {
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);

        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          profileComplete: user.profile?.isOnboarded ?? false,
        } satisfies Record<string, unknown>;
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.sub = user.id as string;
        token.email = user.email;
        token.name = user.name as string | undefined;
        token.profileComplete = (user.profileComplete as boolean) ?? false;
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { profile: true },
        });

        if (dbUser) {
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.profileComplete = dbUser.profile?.isOnboarded ?? false;
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.profileComplete = Boolean(token.profileComplete);
      }

      return session;
    },
  },
};
