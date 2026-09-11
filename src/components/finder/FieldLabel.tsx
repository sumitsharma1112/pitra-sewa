import type { ReactNode } from "react";

/** Bilingual label: the page language first, the other language beneath it. */
export function FieldLabel({
  htmlFor,
  label,
  alt,
  altLang,
  as = "label",
  id,
}: {
  htmlFor?: string;
  label: string;
  alt?: string;
  altLang: string;
  as?: "label" | "legend";
  id?: string;
}) {
  const content: ReactNode = (
    <>
      <span className="block text-lg font-semibold leading-snug text-charcoal">{label}</span>
      {alt && (
        <span lang={altLang} className="block text-base leading-snug text-muted">
          {alt}
        </span>
      )}
    </>
  );
  if (as === "legend") return <legend className="mb-2">{content}</legend>;
  return (
    <label htmlFor={htmlFor} id={id} className="mb-2 block">
      {content}
    </label>
  );
}

export function FieldHint({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-2 text-base leading-relaxed text-muted">
      {children}
    </p>
  );
}

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-2 flex gap-2 text-base font-medium text-danger">
      <span aria-hidden="true">●</span>
      {children}
    </p>
  );
}
