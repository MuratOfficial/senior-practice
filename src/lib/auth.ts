import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/env";

const providers: NextAuthConfig["providers"] = [];

if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) {
  providers.push(GitHub);
}
if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}

// Dev-вход без OAuth: доступен только в development, создаёт пользователя в БД
if (env.NODE_ENV === "development") {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Dev Login",
      credentials: {
        name: { label: "Имя" },
        email: { label: "Email" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "dev@localhost.dev");
        const name = String(credentials?.name || "Dev User");
        const user = await prisma.user.upsert({
          where: { email },
          update: { name },
          create: { email, name },
        });
        return { id: user.id, email: user.email, name: user.name };
      },
    })
  );
}

/** Провайдеры для страницы входа (Credentials рендерится отдельной формой) */
export const oauthProviderIds = providers
  .map((p) => (typeof p === "function" ? p() : p))
  .filter((p) => p.type === "oauth" || p.type === "oidc")
  .map((p) => ({ id: p.id, name: p.name }));

export const hasDevLogin = env.NODE_ENV === "development";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // JWT-сессии: совместимы с Credentials-провайдером и не требуют запроса к БД на каждый рендер
  session: { strategy: "jwt" },
  providers,
  pages: { signIn: "/signin" },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
});
