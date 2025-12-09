// prisma.config.js
import "dotenv/config"; // <--- DODAJ TĘ LINIĘ NA SAMEJ GÓRZE!
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // Ścieżka do Twojego schematu
  schema: "prisma/schema.prisma",

  // Konfiguracja bazy danych
  datasource: {
    // Wczytujemy URL z .env
    url: env("DATABASE_URL"),
  },
});
