"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { NavItem } from "./DesktopNav";

type Props = {
  items: NavItem[];
  labels: { open: string; close: string; nav: string };
  actions: ReactNode;
  footer: ReactNode;
};

/**
 * Full-screen menu for phones and tablets: large targets, one link per row,
 * closes on Escape, on navigation, and returns focus to the menu button.
 */
export function MobileNav({ items, labels, actions, footer }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [lastPath, setLastPath] = useState(pathname);

  // Close when the route changes (adjusting state during render, per React docs).
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="xl:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? labels.close : labels.open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-lg border border-line bg-paper text-maroon"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          )}
        </svg>
      </button>

      <div
        ref={panelRef}
        id={panelId}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[4.75rem] z-50 overflow-y-auto border-t border-line bg-ivory"
      >
        <nav aria-label={labels.nav} className="mx-auto max-w-xl px-5 pb-10 pt-4">
          <ul className="divide-y divide-line">
            {items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-14 items-center text-xl ${
                      active ? "font-semibold text-maroon" : "text-charcoal"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 flex flex-col gap-3">{actions}</div>
          <div className="mt-8">{footer}</div>
        </nav>
      </div>
    </div>
  );
}
