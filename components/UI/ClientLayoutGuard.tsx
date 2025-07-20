"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

export default function ClientLayoutGuard({
  children,
}: {
  children: ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const publicPaths = ["/", "/logowanie", "/rejestracja-dodatkowa"];
  const isPublic = publicPaths.includes(pathname);

  useEffect(() => {
    if (status === "loading") return;

    if (!session && !isPublic) {
      router.replace("/logowanie");
    }
  }, [session, status, isPublic, router]);

  // Można dodać prosty loader przy oczekiwaniu:
  if (status === "loading") return null;

  // Jeśli użytkownik jest niezalogowany i to strona prywatna, nie pokazuj nic:
  if (!session && !isPublic) {
    return null;
  }

  return <>{children}</>;
}
