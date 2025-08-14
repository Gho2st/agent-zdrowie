import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    profileComplete?: boolean;
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    profileComplete?: boolean;
  }
}

const prisma = new PrismaClient();

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/logowanie",
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

    async jwt({ token }) {
      if (token?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            birthdate: true,
            gender: true,
            height: true,
            weight: true,
          },
        });

        if (dbUser) {
          token.id = String(dbUser.id); // zapisujemy id w tokenie
        }

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

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.profileComplete = token.profileComplete;
      }
      return session;
    },
  },
});
