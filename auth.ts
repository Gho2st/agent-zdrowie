// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET, // ⬅️ to jest klucz
  session: {
    strategy: "jwt", // ✅ konieczne!
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!dbUser) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name ?? null,
              image: user.image ?? null,
            },
          });
          console.log("✅ Utworzono nowego użytkownika:", user.email);
        } else {
          console.log("ℹ️ Użytkownik już istnieje:", user.email);
        }

        return true;
      } catch (err) {
        console.error("❌ Błąd podczas logowania:", err);
        return false;
      }
    },

    // 🔐 DODANE: jwt callback
    async jwt({ token, user }) {
      if (!token?.email && user?.email) {
        token.email = user.email;
      }

      if (token?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            birthdate: true,
            gender: true,
            height: true,
            weight: true,
          },
        });

        const profileComplete =
          !!dbUser &&
          dbUser.birthdate instanceof Date &&
          (dbUser.gender === "M" || dbUser.gender === "K") &&
          typeof dbUser.height === "number" &&
          dbUser.height > 0 &&
          typeof dbUser.weight === "number" &&
          dbUser.weight > 0;

        token.profileComplete = profileComplete;
      }

      return token;
    },

    // 🔁 ZAKTUALIZOWANE: session callback
    async session({ session, token }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
        });

        if (dbUser) {
          (session.user as any).id = dbUser.id.toString();
        }
      }

      // Dodaj profileComplete do sesji (opcjonalnie dla client-side)
      if (token?.profileComplete !== undefined) {
        (session as any).profileComplete = token.profileComplete;
      }

      return session;
    },
  },
});
