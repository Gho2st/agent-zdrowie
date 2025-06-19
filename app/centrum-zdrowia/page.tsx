"use client";

import Container from "@/components/UI/Container/Container";
import { useSession } from "next-auth/react";

export default function CentrumZdrowia() {
  const { data: session, status } = useSession();

  return (
    <Container>
      <div>
        {session?.user ? (
          <div>
            <h1 className="text-2xl font-bold">Hej, {session.user.name}</h1>
            <p className="mt-2">Monitorujmy Twoje zdrowie</p>
          </div>
        ) : (
          <p className="text-gray-500">Nie jesteś zalogowany</p>
        )}
      </div>
    </Container>
  );
}
