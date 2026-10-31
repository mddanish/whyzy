import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { getCentralDb } from "@/db/central/client";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/db/central/schema";
import { verifyAgainstDummy, verifyPassword } from "@/lib/password";

const LoginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const db = getCentralDb();
  return {
    // Adapter is kept for OAuth providers later. Credentials login needs JWT sessions.
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
    pages: { signIn: "/login" },
    trustHost: true,
    providers: [
      Credentials({
        credentials: { email: {}, password: {} },
        async authorize(raw) {
          const parsed = LoginSchema.safeParse(raw);
          if (!parsed.success) return null;
          const { email, password } = parsed.data;

          const user = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              passwordHash: users.passwordHash,
            })
            .from(users)
            .where(eq(users.email, email))
            .get();

          if (!user?.passwordHash) {
            await verifyAgainstDummy(password);
            return null;
          }
          if (!(await verifyPassword(password, user.passwordHash))) return null;
          return { id: user.id, name: user.name, email: user.email };
        },
      }),
    ],
    callbacks: {
      jwt({ token, user }) {
        if (user?.id) token.sub = user.id;
        return token;
      },
      session({ session, token }) {
        if (token.sub) session.user.id = token.sub;
        return session;
      },
    },
    // Log error names only: never emails, names or other personal details.
    logger: {
      error(error) {
        console.error(`[auth] ${(error as { type?: string }).type ?? "error"}`);
      },
      warn(code) {
        console.warn(`[auth] ${code}`);
      },
      debug() {},
    },
  };
});
