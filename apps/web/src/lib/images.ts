/**
 * Sourced photography for VumbaView Academy. Scenic/landscape shots are
 * hotlinked from Unsplash's CDN under the Unsplash License (free for
 * commercial use, attribution appreciated but not required) and are used
 * purely as decorative backdrops. Every photo that depicts people is a real
 * photo of VumbaView students on campus (apps/web/public/images/students/),
 * not stock photography — see studentPhotos below.
 */

type SiteImage = {
  src: string;
  alt: string;
  credit: string;
};

function unsplash(id: string, params = "w=1800&q=80&auto=format&fit=crop") {
  return `https://images.unsplash.com/${id}?${params}`;
}

/**
 * Lorem Picsum placeholder photo, seeded so a given slot always gets the
 * same "random" stock photo instead of reshuffling on every render. Kept
 * only as a fallback helper — real student photos (studentPhotos below)
 * should be used in preference to this wherever a people/campus photo is
 * needed.
 */
export function placeholderPhoto(seed: string, width = 1200, height = 900) {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

/**
 * Real candid photos of VumbaView students on campus, taken in school
 * uniform (track tops and blazers) between classroom blocks. Generic by
 * design — group/campus shots rather than posed individual portraits — so
 * they're intentionally reused across many sections of the site (hero
 * banners, page headers, gallery cards) rather than tied to one slot each.
 * Deliberately NOT used as a stand-in for a specific named staff member's
 * headshot (see leadership-highlight.tsx and head-quote.tsx, which use an
 * initials badge instead for that reason).
 */
export const studentPhotos: SiteImage[] = [
  {
    src: "/images/students/IMG-20260623-WA0191.jpg",
    alt: "VumbaView Academy students gathered outside the classroom block",
    credit: "VumbaView Academy",
  },
  {
    src: "/images/students/IMG-20260623-WA0193.jpg",
    alt: "VumbaView Academy students in school uniform on campus",
    credit: "VumbaView Academy",
  },
  {
    src: "/images/students/IMG-20260623-WA0205.jpg",
    alt: "VumbaView Academy students standing together on campus",
    credit: "VumbaView Academy",
  },
  {
    src: "/images/students/IMG-20260623-WA0194.jpg",
    alt: "VumbaView Academy students in winter uniform on campus",
    credit: "VumbaView Academy",
  },
  {
    src: "/images/students/IMG-20260623-WA0178.jpg",
    alt: "VumbaView Academy students lined up on campus",
    credit: "VumbaView Academy",
  },
  {
    src: "/images/students/IMG-20260623-WA0253.jpg",
    alt: "VumbaView Academy students gathered on campus",
    credit: "VumbaView Academy",
  },
  {
    src: "/images/students/IMG-20260623-WA0174.jpg",
    alt: "A VumbaView Academy teacher with students on campus",
    credit: "VumbaView Academy",
  },
  {
    src: "/images/students/IMG-20260623-WA0224.jpg",
    alt: "VumbaView Academy students standing together outside the classroom block",
    credit: "VumbaView Academy",
  },
  {
    src: "/images/students/IMG-20260623-WA0192.jpg",
    alt: "VumbaView Academy students gathered on campus",
    credit: "VumbaView Academy",
  },
  {
    src: "/images/students/IMG-20260623-WA0258.jpg",
    alt: "VumbaView Academy students on campus, with the surrounding hills behind",
    credit: "VumbaView Academy",
  },
];

export const images = {
  heroMountains: {
    src: unsplash("photo-1758642882005-447873fd2d29"),
    alt: "Misty mountain slope covered in evergreen trees, in the style of the Bvumba Mountains near Mutare",
    credit: "Unsplash",
  },
  mountainValley: {
    src: unsplash("photo-1765871319901-0aaafe3f1a2a"),
    alt: "Misty forest valley with mountains in the background",
    credit: "Unsplash",
  },
  mountainRise: {
    src: unsplash("photo-1744425749153-24e87ac4cbc7"),
    alt: "Misty mountains rising above a forest of green trees",
    credit: "Unsplash",
  },
  mountainLandscape: {
    src: unsplash("photo-1747555843535-76ee0af74b62"),
    alt: "Misty green mountain landscape under a cloudy sky",
    credit: "Unsplash",
  },
  forestDay: {
    src: unsplash("photo-1550945233-716f16384ffd"),
    alt: "Misty green forest during daytime",
    credit: "Unsplash",
  },
  // Real student photo (was Unsplash stock) — see studentPhotos above.
  teacherLecturing: studentPhotos[6]!,
  emptyClassroom: {
    src: unsplash("photo-1740635341299-3b8e3490f546"),
    alt: "Bright classroom filled with empty desks and chairs",
    credit: "Unsplash",
  },
  // Real student photo (was Unsplash stock) — see studentPhotos above.
  studentAtDesk: studentPhotos[3]!,
  libraryCircular: {
    src: unsplash("photo-1567562227343-a72d22e187c8"),
    alt: "Library with circular seating area surrounded by bookshelves",
    credit: "Unsplash",
  },
  // Real student photo (was Unsplash stock) — see studentPhotos above.
  graduationToss: studentPhotos[1]!,
  // Real student photo (was Unsplash stock) — see studentPhotos above.
  graduationGroup: studentPhotos[7]!,
  // Real student photo (was Unsplash stock) — see studentPhotos above.
  soccerKidsOne: studentPhotos[4]!,
  // Real student photo (was Unsplash stock) — see studentPhotos above.
  soccerKidsTwo: studentPhotos[5]!,
} satisfies Record<string, SiteImage>;
