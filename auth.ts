import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(1) })
          .safeParse(credentials);
        if (!parsed.success) return null;
        const { getServerEnv } = await import("@/lib/env");
        let env;
        try {
          env = getServerEnv();
        } catch {
          return null;
        }
        const matchEmail =
          parsed.data.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
        const matchPass = await bcrypt.compare(
          parsed.data.password,
          env.ADMIN_PASSWORD_HASH,
        );
        if (!matchEmail || !matchPass) return null;
        return { id: "admin", name: "Admin", email: env.ADMIN_EMAIL };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
});
