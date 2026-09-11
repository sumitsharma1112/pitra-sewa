import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "onDark";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-lg font-semibold leading-tight transition-colors";

const variants: Record<Variant, string> = {
  primary: "bg-maroon text-ivory hover:bg-maroon-hover",
  secondary: "border-2 border-maroon text-maroon hover:bg-sand",
  onDark: "bg-ivory text-maroon-deep hover:bg-sand",
};

type Props = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ variant = "primary", className = "", children, ...rest }: Props) {
  return (
    <Link className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </Link>
  );
}
