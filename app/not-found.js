// app/not-found.tsx
import Link from "next/link";
import { XCircle } from "lucide-react";
import Container from "@/components/UI/Container/Container";

export default function NotFound() {
  return (
    <Container>
      <div className="flex flex-col items-center justify-center text-center">
        <XCircle className="w-24 h-24 text-red-500 mb-6 animate-pulse" />

        <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-4">
          404 – Strona nie znaleziona
        </h1>

        <p className="text-gray-600 text-base sm:text-lg max-w-xl mb-8">
          Wygląda na to, że ta strona nie istnieje. Sprawdź adres URL lub wróć
          na stronę główną.
        </p>

        <Link
          href="/"
          className="rounded-lg bg-red-500 px-6 py-3 text-white font-medium shadow-lg transition-transform duration-300 hover:bg-red-600 hover:-translate-y-1 hover:scale-105"
        >
          Wróć na stronę główną
        </Link>
      </div>
    </Container>
  );
}
