import { DiyaMark } from "./DiyaMark";

type Props = { tone?: "light" | "dark"; name: string; latinName: string };

/** Mark + bilingual wordmark. Devanagari leads; the Latin name supports it. */
export function Logo({ tone = "light", name, latinName }: Props) {
  const dark = tone === "dark";
  return (
    <span className="inline-flex items-center gap-2.5">
      <DiyaMark className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" tone={tone} />
      <span className="flex flex-col leading-none">
        <span
          lang="hi"
          className={`font-display text-[1.6rem] leading-[1.15] ${dark ? "text-ivory" : "text-maroon"}`}
        >
          {name}
        </span>
        <span
          lang="en"
          className={`text-[0.8rem] font-medium tracking-wide ${dark ? "text-gold-light" : "text-gold-ink"}`}
        >
          {latinName}
        </span>
      </span>
    </span>
  );
}
