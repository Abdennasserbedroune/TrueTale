import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      profileComplete: boolean;
    };
  }

  interface User {
    profileComplete?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    profileComplete?: boolean;
  }
}
