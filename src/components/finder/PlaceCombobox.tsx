"use client";

import { useEffect, useId, useRef, useState } from "react";
import { indianStates } from "@/data/states-in";
import type { Locale } from "@/i18n/config";
import { searchPlaces, type PlaceOption } from "@/lib/place-search";

type Texts = { placeholder: string; noResults: string; loading: string; change: string; selected: string };

type Props = {
  id: string;
  locale: Locale;
  value: PlaceOption | null;
  onChange: (p: PlaceOption | null) => void;
  describedBy?: string;
  invalid?: boolean;
  disabled?: boolean;
  texts: Texts;
};

let cache: PlaceOption[] | null = null;
async function loadPlaces(): Promise<PlaceOption[]> {
  if (!cache) cache = (await import("@/data/places-in.json")).default as PlaceOption[];
  return cache;
}

export const placeLabel = (p: PlaceOption, locale: Locale) =>
  `${p.name}, ${indianStates[p.state]?.[locale] ?? ""}`.replace(/, $/, "");

/**
 * Accessible city picker (ARIA 1.2 combobox pattern). The list loads on first
 * use so it does not weigh down the page for people who never open it.
 */
export function PlaceCombobox({ id, locale, value, onChange, describedBy, invalid, disabled, texts }: Props) {
  const listId = useId();
  const [query, setQuery] = useState(value ? placeLabel(value, locale) : "");
  const [places, setPlaces] = useState<PlaceOption[] | null>(cache);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastValue, setLastValue] = useState(value);

  if (value !== lastValue) {
    setLastValue(value);
    setQuery(value ? placeLabel(value, locale) : "");
  }

  const ensureLoaded = () => {
    if (!places) loadPlaces().then(setPlaces);
  };

  const results = places && !value ? searchPlaces(places, query) : [];
  const showList = open && !value && query.trim().length >= 2;

  useEffect(() => {
    if (!showList) return;
    const close = (e: MouseEvent) => {
      if (!inputRef.current?.parentElement?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showList]);

  const choose = (p: PlaceOption) => {
    onChange(p);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        value={query}
        placeholder={texts.placeholder}
        onFocus={ensureLoaded}
        onChange={(e) => {
          ensureLoaded();
          if (value) onChange(null);
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && results[active]) {
            e.preventDefault();
            choose(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className={`field-input pr-24 ${value ? "font-medium text-maroon" : ""}`}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery("");
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className="absolute right-2 top-1/2 min-h-10 -translate-y-1/2 rounded-md px-3 text-base font-medium text-maroon underline underline-offset-4"
        >
          {texts.change}
        </button>
      )}
      <ul
        id={listId}
        role="listbox"
        hidden={!showList}
        className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-line bg-paper py-1 shadow-[0_18px_40px_-24px_rgba(74,22,32,0.45)]"
      >
        {!places && <li className="px-4 py-3 text-muted">{texts.loading}</li>}
        {places && results.length === 0 && <li className="px-4 py-3 text-muted">{texts.noResults}</li>}
        {results.map((p, i) => (
          <li
            key={p.id}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(p)}
            onMouseEnter={() => setActive(i)}
            className={`cursor-pointer px-4 py-3 ${i === active ? "bg-sand text-maroon" : ""}`}
          >
            <span className="font-medium">{p.name}</span>
            <span className="text-muted">, {indianStates[p.state]?.[locale]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
