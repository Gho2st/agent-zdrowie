// auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
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
              // możesz tu dodać wartości domyślne jeśli chcesz
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

    async session({ session }) {
      if (!session.user?.email) return session;

      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (dbUser) {
        (session.user as any).id = dbUser.id.toString();
      }

      return session;
    },
  },
});
