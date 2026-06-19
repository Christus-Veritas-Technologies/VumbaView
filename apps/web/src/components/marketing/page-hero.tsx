import { Eyebrow } from "@/components/marketing/eyebrow";
import Image from "next/image";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  image: { src: string; alt: string };
};

export function PageHero({ eyebrow, title, description, image }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <Image src={image.src} alt={image.alt} fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/60 to-primary/30" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-5 px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <Eyebrow className="bg-white/15 text-white">{eyebrow}</Eyebrow>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {title}
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
          {description}
        </p>
      </div>
    </section>
  );
}
