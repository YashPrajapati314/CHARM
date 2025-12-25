import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      universityid: string;
      name?: string | null;
      email?: string | null;
    };
  }

  interface User {
    universityid: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    universityid: string;
  }
}
