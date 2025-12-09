import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
// WAŻNE: Importujemy instancję z Twojego pliku lib/prisma, a nie tworzymy nowej!
import prisma from "@/lib/prisma";

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
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        const dbUser = await prisma.user.findUnique({
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
        }

        return true;
      } catch (err) {
        console.error("❌ Błąd podczas logowania:", err);
        return false;
      }
    },

    async jwt({ token }) {
      if (!token?.email) return token;

      // 🔹 Pobieramy użytkownika WRAZ z jego profilem medycznym
      const dbUser = await prisma.user.findUnique({
        where: { email: token.email },
        select: {
          id: true,
          // Pobieramy powiązany profil medyczny
          healthProfile: {
            select: {
              id: true,
            },
          },
        },
      });

      if (dbUser) {
        token.id = dbUser.id;

        // Sprawdzamy, czy użytkownik ma uzupełniony profil medyczny.
        // W nowej bazie, jeśli rekord healthProfile istnieje, to znaczy że jest uzupełniony
        // (bo pola w HealthProfile są wymagane, np. waga, wzrost).
        token.profileComplete = !!dbUser.healthProfile;
      } else {
        token.profileComplete = false;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        // Przekazujemy flagę do frontendu, żeby wiedzieć czy przekierować na /profil
        session.profileComplete = token.profileComplete;
      }
      return session;
    },
  },
});
