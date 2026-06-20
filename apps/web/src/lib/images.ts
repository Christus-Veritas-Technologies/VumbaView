/**
 * Sourced photography for VumbaView Academy, hotlinked from Unsplash's CDN
 * under the Unsplash License (free for commercial use, attribution
 * appreciated but not required). Credits are kept here for reference.
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
 * same "random" stock photo instead of reshuffling on every render. Used for
 * home-page body imagery where a real campus/people photo doesn't exist yet
 * - see the placeholder-content note in PLAN.md.
 */
export function placeholderPhoto(seed: string, width = 1200, height = 900) {
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}

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
  teacherLecturing: {
    src: unsplash("photo-1758270704925-fa59d93119c1"),
    alt: "Teacher lecturing a classroom of students",
    credit: "Unsplash",
  },
  emptyClassroom: {
    src: unsplash("photo-1740635341299-3b8e3490f546"),
    alt: "Bright classroom filled with empty desks and chairs",
    credit: "Unsplash",
  },
  studentAtDesk: {
    src: unsplash("photo-1497375638960-ca368c7231e4"),
    alt: "Student sitting at a desk in a classroom",
    credit: "Unsplash",
  },
  libraryCircular: {
    src: unsplash("photo-1567562227343-a72d22e187c8"),
    alt: "Library with circular seating area surrounded by bookshelves",
    credit: "Unsplash",
  },
  graduationToss: {
    src: unsplash("photo-1775623606576-3e049f72b8e7"),
    alt: "Graduates tossing their caps in the air",
    credit: "Unsplash",
  },
  graduationGroup: {
    src: unsplash("photo-1661693758705-4fa65572bced"),
    alt: "Group of graduates wearing gowns",
    credit: "Unsplash",
  },
  soccerKidsOne: {
    src: unsplash("photo-1526232761682-d26e03ac148e"),
    alt: "Children playing soccer outdoors",
    credit: "Unsplash",
  },
  soccerKidsTwo: {
    src: unsplash("photo-1701872324421-f537bc8f61de"),
    alt: "A couple of kids playing a game of soccer",
    credit: "Unsplash",
  },
} satisfies Record<string, SiteImage>;
