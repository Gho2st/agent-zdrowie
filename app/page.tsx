"use client";

import { useSession } from "next-auth/react";

export default function App() {
  const { data: session, status } = useSession();

  console.log("session:", session);
  console.log("status:", status);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Status: {status}</h1>
      {session?.user ? (
        <div>
          <p>Email: {session.user.email}</p>
          <p>Imię: {session.user.name}</p>
        </div>
      ) : (
        <p>Nie jesteś zalogowany.</p>
      )}
    </div>
  );
}
