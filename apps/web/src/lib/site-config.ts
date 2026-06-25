export const siteConfig = {
  name: "VumbaView Academy",
  shortName: "VumbaView",
  motto: "Discipline In, Distinction Out",
  description:
    "VumbaView Academy is a ZIMSEC day school in Mutare, Zimbabwe, taking students from Form 1 to Form 6 and measuring itself by one thing above all: the results they walk away with.",
  founded: 2022,
  url: "https://www.vumbaview.ac.zw",
} as const;

export const schoolFacts = {
  enrollment: "200+",
  staffToStudentRatio: "1:14",
  founded: 2022,
  campusSize: "18 hectares",
  curriculum: "ZIMSEC O-Level and A-Level, with Cambridge-aligned enrichment in the senior forms",
  headOfSchool: {
    name: "Mr. Chimahi",
    title: "Head of School",
  },
} as const;

export const contactInfo = {
  addressLines: ["14 Vumba Road", "Mutare, Manicaland", "Zimbabwe"],
  phone: "+263 20 123 4567",
  mobile: "+263 77 234 5678",
  email: "info@vumbaview.ac.zw",
  admissionsEmail: "admissions@vumbaview.ac.zw",
  officeHours: "Monday â€“ Friday, 7:30 â€“ 16:00",
  mapEmbedSrc:
    "https://www.openstreetmap.org/export/embed.html?bbox=32.6209%2C-19.0007%2C32.7209%2C-18.9407&layer=mapnik&marker=-18.9707%2C32.6709",
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
    stage: "Lower Secondary â€” Form 1 to 4",
    ageRange: "Ages 13 â€“ 16",
    description:
      "A ZIMSEC O-Level pathway across the sciences, humanities, and languages, with weekly assessment so no learner falls behind unnoticed.",
  },
  {
    stage: "Upper Secondary â€” Form 5 to 6",
    ageRange: "Ages 17 â€“ 18",
    description:
      "A-Level specialisation in three to five subjects, built around the ZIMSEC \"A\" Level Examinations and direct preparation for university and career placement.",
  },
] as const;
