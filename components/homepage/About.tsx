"use client";
import { motion, Variants, Transition } from "framer-motion";
import Image from "next/image";

// Sekcje animacji
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { when: "beforeChildren", staggerChildren: 0.2 },
  },
};

// Definicja przejścia dla kart
const cardTransition: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 10,
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: cardTransition,
  },
  hover: {
    scale: 1.05,
    boxShadow: "0px 10px 20px rgba(0,0,0,0.2)",
    transition: { duration: 0.3 },
  },
};

// Przejście obrazu
const imageTransition: Transition = {
  duration: 0.8,
};

const imageVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: imageTransition,
  },
};

export default function About() {
  return (
    <motion.section
      className="md:py-10"
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
    >
      <motion.h1
        className="text-3xl md:text-4xl 2xl:text-5xl leading-snug font-bold text-center"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.6 } },
        }}
      >
        Agent Zdrowie – Twój cyfrowy asystent zdrowia
      </motion.h1>

      <motion.p
        className="my-10 text-lg md:text-xl text-center max-w-3xl mx-auto"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { delay: 0.3, duration: 0.6 } },
        }}
      >
        Nowoczesna aplikacja zdrowotna, która nie tylko zapisuje pomiary – ona
        je rozumie. Dzięki sztucznej inteligencji analizuje Twoje dane i wspiera
        Cię w dbaniu o zdrowie każdego dnia.
      </motion.p>

      <div className="flex flex-col-reverse lg:flex-row items-center gap-10 mt-16">
        {/* Karty tekstowe */}
        <div className="grid sm:grid-cols-2 gap-6 flex-1 w-full">
          {[
            {
              emoji: "🤖",
              title: "Spersonalizowana analiza",
              text: "Dzięki integracji z Twoim profilem zdrowotnym, Agent interpretuje wyniki pomiarów w kontekście wieku, płci, historii chorób i leków.",
            },
            {
              emoji: "📊",
              title: "Połączenie z bazą danych",
              text: "Wszystkie pomiary są zapisywane i analizowane – aplikacja pamięta Twoje ostatnie wartości i wykrywa zmiany na przestrzeni czasu.",
            },
            {
              emoji: "🚨",
              title: "Inteligentne ostrzeżenia",
              text: "Przekroczyłeś normę ciśnienia? Glukoza za wysoka? Agent nie tylko Ci to powie, ale też wyjaśni dlaczego to ważne.",
            },
            {
              emoji: "💡",
              title: "Rozmowy z AI",
              text: "Zadaj pytanie, opisz objawy lub poproś o interpretację wyników – Agent odpowie, jak empatyczny doradca zdrowia.",
            },
          ].map((item) => (
            <motion.div
              key={item.title}
              className="bg-white/30 backdrop-blur-sm border border-white/40 p-6 rounded-2xl transition"
              variants={cardVariants}
              whileHover="hover"
            >
              <h2 className="text-xl font-semibold mb-2">
                {item.emoji} {item.title}
              </h2>
              <p className="text-gray-700">{item.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Obraz */}
        <motion.div className="w-full lg:w-1/3" variants={imageVariants}>
          <Image
            src="/agent.png"
            alt="agent ai"
            width={500}
            height={500}
            layout="responsive"
            priority
          />
        </motion.div>
      </div>
    </motion.section>
  );
}
