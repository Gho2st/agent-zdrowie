"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  BrainCircuit,
  Activity,
  AlertCircle,
  MessageCircleHeart,
  Sparkles,
} from "lucide-react";

// --- ANIMACJE ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 50 },
  },
};

export default function About() {
  const features = [
    {
      icon: BrainCircuit,
      title: "Spersonalizowana analiza",
      text: "Nie jestem zwykłym algorytmem. Biorę pod uwagę Twój wiek, płeć i historię, aby wyniki miały kontekst.",
    },
    {
      icon: Activity,
      title: "Ciągły monitoring",
      text: "Zapisuję Twoje pomiary w bezpiecznej bazie, tworząc czytelną historię Twojego zdrowia.",
    },
    {
      icon: AlertCircle,
      title: "Inteligentne alerty",
      text: "Gdy ciśnienie lub cukier przekroczą normy, natychmiast Cię o tym poinformuję i podpowiem, co robić.",
    },
    {
      icon: MessageCircleHeart,
      title: "Empatyczne rozmowy",
      text: "Zadaj pytanie o objawy lub leki. Odpowiem prostym językiem, bez medycznego żargonu.",
    },
  ];

  return (
    <section className="mt-24 py-10 px-4 overflow-hidden relative">
      {/* Tło dekoracyjne */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-emerald-50/50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4" />

      <div className="max-w-7xl mx-auto">
        {/* NAGŁÓWEK */}
        <motion.div
          className="text-center mb-16 space-y-4"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            Twój Asystent AI
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Poznaj{" "}
            <span className="text-emerald-600 relative inline-block">
              Agenta Zdrowie
              <svg
                className="absolute w-full h-3 bottom-1 left-0 text-emerald-200/50 -z-10"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 5 Q 50 10 100 5"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                />
              </svg>
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Twój osobisty opiekun dostępny 24/7. Analizuje, doradza i dba o to,
            byś podejmował najlepsze decyzje dla swojego organizmu.
          </p>
        </motion.div>

        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 xl:gap-20">
          {/* LEWA KOLUMNA - KARTY */}
          <motion.div
            className="grid sm:grid-cols-2 gap-5 flex-1 w-full"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((item) => (
              <motion.div
                key={item.title}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group bg-white border border-gray-100 p-6 rounded-3xl shadow-lg shadow-gray-200/40 hover:shadow-xl hover:shadow-emerald-100/40 hover:border-emerald-200 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <item.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* PRAWA KOLUMNA - OBRAZ AGENTA */}
          <motion.div
            className="w-full lg:w-5/12 relative flex justify-center"
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* Tło pod obrazkiem (Blob) */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-teal-50 rounded-full blur-2xl opacity-60 scale-90 animate-pulse" />

            <div className="relative z-10 w-full max-w-md drop-shadow-2xl">
              <Image
                src="/images/agent.png"
                alt="Agent Zdrowie"
                width={600}
                height={600}
                className="object-contain rounded-3xl transform hover:scale-105 transition-transform duration-500"
                priority
              />

              {/* Pływające elementy UI wokół agenta */}
              <motion.div
                className="absolute -left-6 top-10 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3"
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div className="bg-red-50 p-2 rounded-full text-red-500">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">
                    Tętno
                  </p>
                  <p className="text-sm font-bold text-gray-800">72 bpm</p>
                </div>
              </motion.div>

              <motion.div
                className="absolute -right-4 bottom-20 bg-white p-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3"
                animate={{ y: [0, 10, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
              >
                <div className="bg-blue-50 p-2 rounded-full text-blue-500">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">
                    Status AI
                  </p>
                  <p className="text-sm font-bold text-gray-800">Aktywny</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
