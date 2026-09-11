"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

export function DesktopNav({ items, label }: { items: NavItem[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="hidden xl:block">
      <ul className="flex items-center gap-0.5">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-11 items-center whitespace-nowrap rounded-md px-2 text-[1.0625rem] leading-none transition-colors hover:text-maroon ${
                  active
                    ? "text-maroon after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:rounded-full after:bg-gold"
                    : "text-charcoal"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
