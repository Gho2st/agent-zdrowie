import {
  Heart,
  Github,
  Mail,
  Activity,
  Shield,
  User,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full bg-white relative overflow-hidden">
      {/* 1. Dekoracyjna linia gradientowa na górze */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent opacity-70" />

      {/* 2. Subtelne tło (Glow effect) */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 mb-12">
          {/* KOLUMNA 1: Branding (Szeroka - zajmuje 5/12 siatki na dużych ekranach) */}
          <div className="md:col-span-5 space-y-6">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <Activity className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">
                Agent Zdrowie
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              Nowoczesne podejście do profilaktyki. Twój osobisty asystent
              medyczny wspierany przez sztuczną inteligencję, dostępny 24/7.
            </p>
          </div>

          {/* KOLUMNA 2: Nawigacja */}
          <div className="md:col-span-3 lg:col-span-3">
            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4">
              Aplikacja
            </h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li>
                <Link
                  href="/profil"
                  className="group flex items-center gap-2 hover:text-emerald-600 transition-all duration-200 hover:translate-x-1"
                >
                  <User className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                  <span>Twój Profil</span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="group flex items-center gap-2 hover:text-emerald-600 transition-all duration-200 hover:translate-x-1"
                >
                  <Shield className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                  <span>Polityka Prywatności</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* KOLUMNA 3: Kontakt / Społeczność */}
          <div className="md:col-span-4 lg:col-span-4">
            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4">
              Kontakt & Community
            </h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li>
                <a
                  href="https://github.com/Gho2st/agent-zdrowie"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 hover:text-emerald-600 transition-all duration-200 hover:translate-x-1"
                >
                  <Github className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                  <span>GitHub (Open Source)</span>
                  <ExternalLink className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                </a>
              </li>
              <li>
                <a
                  href="mailto:dominik.jojczyk@gmail.com"
                  className="group flex items-center gap-2 hover:text-emerald-600 transition-all duration-200 hover:translate-x-1"
                >
                  <Mail className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                  <span>dominik.jojczyk@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* DOLNY PASEK */}
        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p>&copy; {currentYear} Agent Zdrowie. Projekt stworzony z pasji.</p>

          <div className="flex items-center gap-2 bg-slate-50/80 px-4 py-1.5 rounded-full border border-slate-100 shadow-sm backdrop-blur-sm">
            <span>Made with</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            <span>by Dominik Jojczyk</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
