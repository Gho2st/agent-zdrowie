"use client";

import { useSession } from "next-auth/react";
import Container from "@/components/UI/Container/Container";
import PowitanieMotywacja from "@/components/UI/CentrumZdrowia/Powitanie";

export default function CentrumZdrowia() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Użytkowniku";

  return (
    <Container>
      {session?.user ? (
        <div className="max-w-4xl mx-auto py-10 px-4">
          <PowitanieMotywacja userName={userName} />
        </div>
      ) : (
        <p className="text-gray-500 text-center mt-20 text-lg">
          Nie jesteś zalogowany
        </p>
      )}
    </Container>
  );
}
