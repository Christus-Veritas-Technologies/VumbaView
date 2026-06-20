import { PrismaClient } from "@prisma/client";
import type { AcademicLevel, EnrollmentStatus, PaymentCategory } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@vva/env/server";
import { hashPassword } from "../src/lib/password";
import { ACADEMIC_LEVELS } from "../src/lib/levels";

// Prisma 7 requires an explicit driver adapter for every database — this is
// a standalone script (not the long-lived app client in src/db.ts), so it
// gets its own short-lived adapter/connection.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Fictional demo data only — consistent with the marketing site's setting
// (VumbaView, near Mutare / the Vumba mountains, Zimbabwe).
const FIRST_NAMES = [
  "Tendai", "Rutendo", "Tatenda", "Farai", "Chiedza", "Kudakwashe", "Tinotenda", "Rumbidzai",
  "Munyaradzi", "Chenai", "Tafadzwa", "Nyasha", "Vimbai", "Anesu", "Tariro", "Simbarashe",
  "Blessing", "Privilege", "Tanaka", "Wadzanai", "Takudzwa", "Ropafadzo", "Panashe", "Tadiwanashe",
  "Nokutenda", "Praise", "Memory", "Prosper", "Mukai", "Shamiso", "Chipo", "Rufaro",
  "Kundai", "Nyarai", "Sekai", "Tamuka", "Tapiwa", "Vongai", "Yeukai", "Gamuchirai",
  "Charity", "Faith", "Hope", "Patience", "Mercy", "James", "Michael", "John",
  "Daniel", "David", "Joseph", "Emmanuel", "Grace", "Linda", "Susan", "Patricia",
  "Tracy", "Brian", "Kevin", "Trevor", "Lloyd", "Garikai",
];

const SURNAMES = [
  "Moyo", "Ncube", "Sibanda", "Dube", "Chikwava", "Mutasa", "Chirwa", "Mhlanga",
  "Gumbo", "Chigumba", "Mapfumo", "Mawere", "Chivasa", "Madzimure", "Nyathi", "Zinyemba",
  "Muchenje", "Marufu", "Chitiyo", "Chinhema", "Chimuti", "Mafuta", "Karimanzira", "Musonza",
  "Chideme", "Hove", "Banda", "Phiri", "Tshuma", "Khumalo", "Ndlovu", "Mukwena",
  "Chipanga", "Manyika", "Chipato", "Zikhali", "Gwena", "Madondo", "Chiware", "Chitando",
];

const SUBURBS = [
  "Dangamvura", "Sakubva", "Yeovil", "Chikanga", "Hobhouse", "Florida", "Murambi",
  "Greenside", "Tiger's Kloof", "Paulington",
];

const CUSTOM_NOTES = ["Stationery", "Exam fee", "Trip contribution", "Sports kit", "Textbook deposit"];

const BASE_AGE: Record<AcademicLevel, number> = {
  ECD_A: 3, ECD_B: 4,
  GRADE_1: 6, GRADE_2: 7, GRADE_3: 8, GRADE_4: 9, GRADE_5: 10, GRADE_6: 11, GRADE_7: 12,
  FORM_1: 13, FORM_2: 14, FORM_3: 15, FORM_4: 16, FORM_5: 17, FORM_6: 18,
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomPhone(): string {
  return `+263 7${randomInt(1, 8)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`;
}

function randomDob(level: AcademicLevel): Date {
  const age = BASE_AGE[level] + randomInt(-1, 1);
  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - age);
  dob.setDate(dob.getDate() - randomInt(0, 364));
  return dob;
}

function randomStatus(): EnrollmentStatus {
  const roll = Math.random();
  if (roll < 0.92) return "ACTIVE";
  return roll < 0.96 ? "WITHDRAWN" : "GRADUATED";
}

async function main() {
  const existingStaff = await prisma.staff.count();

  if (existingStaff > 0) {
    console.log("Database already has staff accounts — skipping seed (run against an empty DB).");
    return;
  }

  console.log("Seeding demo staff accounts...");
  const [adminHash, receptionistHash] = await Promise.all([
    hashPassword("admin123"),
    hashPassword("reception123"),
  ]);

  await prisma.staff.createMany({
    data: [
      { username: "admin", passwordHash: adminHash, role: "ADMIN" },
      { username: "reception", passwordHash: receptionistHash, role: "RECEPTIONIST" },
    ],
  });

  const admin = await prisma.staff.findUniqueOrThrow({ where: { username: "admin" } });
  const receptionist = await prisma.staff.findUniqueOrThrow({ where: { username: "reception" } });

  console.log("Seeding per-level fee settings (all $0 — set real amounts from Admin Settings)...");
  await prisma.levelFeeSetting.createMany({
    data: ACADEMIC_LEVELS.map((level) => ({ level: level as AcademicLevel, amount: 0 })),
  });

  console.log("Starting initial term (Term 1, $0 fees)...");
  const term = await prisma.term.create({ data: { number: 1, isCurrent: true } });
  await prisma.termLevelFee.createMany({
    data: ACADEMIC_LEVELS.map((level) => ({ termId: term.id, level: level as AcademicLevel, amount: 0 })),
  });

  console.log("Seeding students across all levels...");
  const createdStudentIds: string[] = [];

  for (const level of ACADEMIC_LEVELS) {
    const count = randomInt(12, 16);

    for (let i = 0; i < count; i++) {
      const firstName = pick(FIRST_NAMES);
      const surname = pick(SURNAMES);
      const guardianSurname = Math.random() < 0.85 ? surname : pick(SURNAMES);
      const hasEmail = Math.random() < 0.7;

      const student = await prisma.student.create({
        data: {
          fullName: `${firstName} ${surname}`,
          level: level as AcademicLevel,
          status: randomStatus(),
          dateOfBirth: randomDob(level as AcademicLevel),
          guardianName: `${pick(FIRST_NAMES)} ${guardianSurname}`,
          guardianPhone: randomPhone(),
          guardianEmail: hasEmail
            ? `${firstName}.${guardianSurname}${randomInt(1, 99)}@gmail.com`.toLowerCase()
            : undefined,
          guardianAddress: `${randomInt(1, 200)} ${pick(SUBURBS)}, Mutare`,
          createdById: admin.id,
        },
      });

      createdStudentIds.push(student.id);
    }
  }

  console.log(`Seeding demo payments (fee amounts are $0 this term, so these are record-keeping only)...`);
  let totalPayments = 0;

  for (const studentId of createdStudentIds) {
    // Not every student has a payment yet — realistic, uneven demo data.
    if (Math.random() < 0.45) continue;

    const numPayments = randomInt(1, 2);

    for (let i = 0; i < numPayments; i++) {
      const roll = Math.random();
      const category: PaymentCategory = roll < 0.7 ? "FEES" : roll < 0.85 ? "UNIFORMS" : "CUSTOM";
      const recordedById = Math.random() < 0.8 ? receptionist.id : admin.id;

      await prisma.payment.create({
        data: {
          studentId,
          category,
          amount: category === "FEES" ? pick([20, 25, 30, 40, 50, 60, 75, 100]) : pick([5, 8, 10, 15, 20]),
          note: category === "CUSTOM" ? pick(CUSTOM_NOTES) : undefined,
          termId: term.id,
          recordedById,
        },
      });

      totalPayments++;
    }
  }

  console.log(
    `Done. ${createdStudentIds.length} students, 2 staff accounts, 1 term ($0 fees), ${totalPayments} demo payments.`,
  );
  console.log("Login — admin: admin / admin123");
  console.log("Login — receptionist: reception / reception123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
