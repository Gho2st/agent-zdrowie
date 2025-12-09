import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Używamy Twojej działającej instancji

export async function GET() {
  // 👇 WPISZ TUTAJ SWÓJ EMAIL
  const USER_EMAIL = "dominik.jojczyk@gmail.com"; 

  try {
    // 1. Znajdź użytkownika
    const user = await prisma.user.findUnique({
      where: { email: USER_EMAIL },
    });

    if (!user) {
      return NextResponse.json({ error: `Nie znaleziono użytkownika: ${USER_EMAIL}` }, { status: 404 });
    }

    const measurements = [];
    const today = new Date();

    // 2. Generuj dane dla ostatnich 90 dni
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      // Losowa godzina między 8:00 a 20:00
      date.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

      // --- WAGA ---
      // Symulacja: waga spada z 85kg do 82kg
      const baseWeight = 85 - (3 * (90 - i)) / 90; 
      const randomWeight = baseWeight + (Math.random() - 0.5);
      
      measurements.push({
        userId: user.id,
        type: "WEIGHT",
        value: parseFloat(randomWeight.toFixed(1)),
        unit: "kg",
        createdAt: date,
      });

      // --- CIŚNIENIE ---
      const sys = Math.floor(120 + Math.random() * 15 - 5); // 115-130
      const dia = Math.floor(80 + Math.random() * 10 - 5);  // 75-85
      
      measurements.push({
        userId: user.id,
        type: "BLOOD_PRESSURE",
        value: sys,       // Skurczowe
        value2: dia,      // Rozkurczowe
        unit: "mmHg",
        createdAt: date,
      });

      // --- CUKIER (co 2 dni) ---
      if (i % 2 === 0) {
        const glukoza = Math.floor(90 + Math.random() * 20); // 90-110
        measurements.push({
          userId: user.id,
          type: "GLUCOSE",
          value: glukoza,
          unit: "mg/dL",
          context: Math.random() > 0.5 ? "na czczo" : "po posiłku",
          createdAt: date,
        });
      }
      
      // --- TĘTNO ---
      const puls = Math.floor(60 + Math.random() * 20);
      measurements.push({
        userId: user.id,
        type: "HEART_RATE",
        value: puls,
        unit: "bpm",
        createdAt: date,
      });
    }

    // 3. Zapisz do bazy
    // createMany jest szybsze niż pętla
    await prisma.measurement.createMany({
      data: measurements,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Dodano ${measurements.length} pomiarów dla ${user.email}`,
      count: measurements.length 
    });

  } catch (error) {
    console.error("Błąd seedowania:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}