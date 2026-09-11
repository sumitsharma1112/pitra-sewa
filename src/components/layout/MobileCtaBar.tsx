"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  label: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
  /** Hide the bar while this element (the hero's own buttons) is on screen. */
  watchId?: string;
};

/** Always-reachable actions on small screens, without doubling up on the hero buttons. */
export function MobileCtaBar({ label, primary, secondary, watchId = "hero-actions" }: Props) {
  // On the home page the hero buttons are on screen at load, so start hidden to avoid a flash.
  const pathname = usePathname();
  const isHome = /^\/(hi|en)\/?$/.test(pathname ?? "");
  const [heroVisible, setHeroVisible] = useState(isHome);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setHeroVisible(isHome);
  }

  useEffect(() => {
    const target = document.getElementById(watchId);
    if (!target) return;
    const io = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting), {
      rootMargin: "0px 0px -10% 0px",
    });
    io.observe(target);
    return () => io.disconnect();
  }, [watchId, pathname]);

  return (
    <nav
      aria-label={label}
      inert={heroVisible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-300 xl:hidden print:hidden ${
        heroVisible ? "translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="mx-auto grid max-w-xl grid-cols-2 gap-3">
        <Link
          href={primary.href}
          className="flex min-h-12 items-center justify-center rounded-lg bg-maroon px-3 text-center text-lg font-semibold leading-tight text-ivory"
        >
          {primary.label}
        </Link>
        <Link
          href={secondary.href}
          className="flex min-h-12 items-center justify-center rounded-lg border-2 border-maroon px-3 text-center text-lg font-semibold leading-tight text-maroon"
        >
          {secondary.label}
        </Link>
      </div>
    </nav>
  );
}
