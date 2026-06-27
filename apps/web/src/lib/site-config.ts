export const siteConfig = {
  name: "VumbaView Academy",
  shortName: "VumbaView",
  motto: "Discipline In, Distinction Out",
  description:
    "VumbaView Academy is a ZIMSEC day school in Mutare, Zimbabwe, taking students from ECD all the way to A-Level and measuring itself by one thing above all: the results they walk away with.",
  founded: 2022,
  url: "https://www.vumbaviewacademy.co.zw",
} as const;

export const schoolFacts = {
  enrollment: "200+",
  staffToStudentRatio: "1:14",
  founded: 2022,
  campusSize: "18 hectares",
  curriculum: "ZIMSEC, from ECD through Primary to O-Level and A-Level, with Cambridge-aligned enrichment in the senior forms",
  headOfSchool: {
    name: "Mr. Chimahi",
    title: "Head of School",
  },
} as const;

export const contactInfo = {
  addressLines: ["Stand Number 3, Chishakwe", "Mutare, Manicaland", "Zimbabwe"],
  phone: "+263 77 302 1456",
  email: "admin@vumbaviewacademy.co.zw",
  admissionsEmail: "admissions@vumbaviewacademy.co.zw",
  officeHours: "Monday – Friday, 7:30 – 16:00",
  mapEmbedSrc: "https://www.google.com/maps?q=-19.165480,32.682633&z=16&output=embed",
  mapLink: "https://maps.app.goo.gl/Xe84DU4ZMKSn2SadA",
} as const;

export type NavLink = {
  href: "/" | "/about" | "/academics" | "/admissions" | "/contact";
  label: string;
};

export const navLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/academics", label: "Academics" },
  { href: "/admissions", label: "Admissions" },
  { href: "/contact", label: "Contact" },
];

export const academicLevels = [
  {
    stage: "Early Childhood Development — ECD A & B",
    ageRange: "Ages 3 – 5",
    description:
      "A play-based foundation in literacy, numeracy, and social skills, building the routines and confidence every learner needs before Grade 1.",
  },
  {
    stage: "Primary — Grade 1 to 7",
    ageRange: "Ages 6 – 12",
    description:
      "A structured primary curriculum across the core subjects, with weekly assessment so every learner is fully prepared for the Grade 7 examinations.",
  },
  {
    stage: "Lower Secondary — Form 1 to 4",
    ageRange: "Ages 13 – 16",
    description:
      "A ZIMSEC O-Level pathway across the sciences, humanities, and languages, with weekly assessment so no learner falls behind unnoticed.",
  },
  {
    stage: "Upper Secondary — Form 5 to 6",
    ageRange: "Ages 17 – 18",
    description:
      "A-Level specialisation in three to five subjects, built around the ZIMSEC \"A\" Level Examinations and direct preparation for university and career placement.",
  },
] as const;
