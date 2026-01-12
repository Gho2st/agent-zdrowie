"use client";

import { motion } from "framer-motion";
import { ArrowRight, HeartPulse } from "lucide-react";
import Link from "next/link";

export default function Cta() {
  return (
    <section className="mt-32 py-20 px-4 relative overflow-hidden">
      {/* Delikatne tło gradientowe */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-emerald-50/30 to-emerald-100/40" />

      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Zacznij monitorować swoje zdrowie
            <span className="block text-emerald-600 mt-2">już dziś</span>
          </h2>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Dołącz do użytkowników, którzy dzięki Agentowi Zdrowie lepiej
            rozumieją swoje wyniki i podejmują świadome decyzje prozdrowotne.
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="mt-10"
          >
            <Link
              href="/logowanie"
              className="inline-flex items-center gap-3 px-8 py-5 bg-emerald-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:bg-emerald-700 hover:shadow-xl transition-all duration-300"
            >
              <HeartPulse className="w-6 h-6" />
              Rozpocznij teraz
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          <p className="text-sm text-gray-500 mt-6">
            Rejestracja przez Google – szybka i bezpieczna
          </p>
        </motion.div>
      </div>
    </section>
  );
}
