"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function ClientLayoutGuard({
  children,
}: {
  children: ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (status !== "authenticated") return;

      try {
        setCheckingProfile(true);
        const res = await fetch("/api/user/profile-complete");
        const data = await res.json();

        if (!data.complete && pathname !== "/rejestracja-dodatkowa") {
          router.replace("/rejestracja-dodatkowa");
        }
      } catch (err) {
        console.error("❌ Błąd sprawdzania profilu:", err);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfile();
  }, [status, pathname, router]);

  if (status === "loading" || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}
