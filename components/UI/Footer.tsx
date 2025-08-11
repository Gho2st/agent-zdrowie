// components/UI/Footer/Footer.tsx
import { Heart, Github, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
        {/* Lewa strona */}
        <div className="flex items-center gap-1">
          <span>© {new Date().getFullYear()} Agent Zdrowie</span>
          <Heart className="h-4 w-4 text-red-500 animate-pulse" />
          <span className="text-gray-500">Twoje zdrowie w dobrych rękach</span>
        </div>

        {/* Prawa strona */}
        <div className="flex items-center gap-5">
          <a
            href="https://github.com/Gho2st/agent-zdrowie"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-gray-800 transition"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>
          <a
            href="mailto:dominik.jojczyk@gmail.com"
            className="flex items-center gap-1 hover:text-gray-800 transition"
          >
            <Mail className="h-4 w-4" />
            <span>Kontakt</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
