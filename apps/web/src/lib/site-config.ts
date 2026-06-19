export const siteConfig = {
  name: "VumbaView Academy",
  shortName: "VumbaView",
  motto: "Through the Mist, Into the Light",
  description:
    "VumbaView Academy is an ECD-to-A-Level day school on the slopes above Mutare, Zimbabwe, overlooking the Bvumba Mountains.",
  founded: 2022,
  url: "https://www.vumbaview.ac.zw",
} as const;

export const schoolFacts = {
  enrollment: "200+",
  staffToStudentRatio: "1:14",
  founded: 2022,
  campusSize: "18 hectares",
  curriculum: "ZIMSEC, with Cambridge-aligned enrichment in the senior forms",
  headOfSchool: {
    name: "Mrs. Tendai Chikwava",
    title: "Head of School",
  },
} as const;

export const contactInfo = {
  addressLines: ["14 Vumba Road", "Mutare, Manicaland", "Zimbabwe"],
  phone: "+263 20 123 4567",
  mobile: "+263 77 234 5678",
  email: "info@vumbaview.ac.zw",
  admissionsEmail: "admissions@vumbaview.ac.zw",
  officeHours: "Monday – Friday, 7:30 – 16:00",
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
    stage: "ECD A & B",
    ageRange: "Ages 3 – 5",
    description:
      "Play-based early childhood development classes building first language, number, and social skills.",
  },
  {
    stage: "Primary — Grade 1 to 7",
    ageRange: "Ages 6 – 12",
    description:
      "A full primary curriculum leading to the ZIMSEC Grade 7 Examination, with daily reading, mathematics, and environmental science.",
  },
  {
    stage: "Lower Secondary — Form 1 to 4",
    ageRange: "Ages 13 – 16",
    description:
      "O-Level pathway across the sciences, humanities, and languages, culminating in the ZIMSEC \"O\" Level Examinations.",
  },
  {
    stage: "Upper Secondary — Form 5 to 6",
    ageRange: "Ages 17 – 18",
    description:
      "A-Level specialisation in three to five subjects, culminating in the ZIMSEC \"A\" Level Examinations and university placement.",
  },
] as const;
