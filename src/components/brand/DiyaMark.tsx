/**
 * Brand mark: a brass diya on a lotus pedestal with a single flame.
 * Pure SVG (no image licence needed); scales from favicon to footer.
 */
type Props = { className?: string; tone?: "light" | "dark" };

export function DiyaMark({ className = "h-10 w-10", tone = "light" }: Props) {
  const bowl = tone === "light" ? "var(--color-maroon)" : "var(--color-gold-light)";
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <path
        d="M20 3.5c3.6 5 5.6 8.6 5.6 12.2 0 3.4-2.5 5.8-5.6 5.8s-5.6-2.4-5.6-5.8c0-3.6 2-7.2 5.6-12.2Z"
        fill="var(--color-saffron)"
      />
      <path
        d="M20 10.5c1.7 2.6 2.6 4.4 2.6 6 0 1.7-1.1 2.8-2.6 2.8s-2.6-1.1-2.6-2.8c0-1.6.9-3.4 2.6-6Z"
        fill="#F6DDA6"
      />
      <path d="M5.5 23.5h29c-1 6.2-6.6 9.8-14.5 9.8S6.5 29.7 5.5 23.5Z" fill={bowl} />
      <path
        d="M20 33.3c-2.7 1.6-5.4 2.2-8 2.2 2.2 1.3 5 1.9 8 1.9s5.8-.6 8-1.9c-2.6 0-5.3-.6-8-2.2Z"
        fill="var(--color-gold)"
      />
    </svg>
  );
}
