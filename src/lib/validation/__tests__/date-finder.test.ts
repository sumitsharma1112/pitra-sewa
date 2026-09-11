import { describe, expect, it } from "vitest";
import { validateFinder, yearOptions } from "../date-finder";

const now = new Date("2026-09-11T06:00:00Z");
const exists = (id: string) => id === "1268782" || id === "1273294";
const valid = {
  name: "Ram Prasad",
  deathDay: "12",
  deathMonth: "3",
  deathYear: "2019",
  deathTime: "10:30",
  deathPlaceId: "1268782",
  kind: "pitru-paksha",
  monthSystem: "purnimanta",
  year: "2026",
  observancePlaceId: "1273294",
  notes: "",
};

describe("validateFinder", () => {
  it("accepts a complete form", () => {
    const r = validateFinder(valid, exists, now);
    expect(r).toEqual({
      ok: true,
      data: {
        name: "Ram Prasad",
        deathDate: "2019-03-12",
        deathTime: "10:30",
        deathPlaceId: "1268782",
        kind: "pitru-paksha",
        monthSystem: "purnimanta",
        year: 2026,
        observancePlaceId: "1273294",
        notes: undefined,
      },
    });
  });

  it("rejects impossible and future dates", () => {
    expect(validateFinder({ ...valid, deathDay: "31", deathMonth: "2" }, exists, now)).toMatchObject({
      ok: false,
      errors: { deathDate: "invalidDate" },
    });
    expect(validateFinder({ ...valid, deathDay: "12", deathMonth: "9", deathYear: "2026" }, exists, now)).toMatchObject({
      ok: false,
      errors: { deathDate: "futureDate" },
    });
    expect(validateFinder({ ...valid, deathYear: "1850" }, exists, now)).toMatchObject({
      errors: { deathDate: "tooOld" },
    });
  });

  it("needs a time or an explicit 'not known'", () => {
    expect(validateFinder({ ...valid, deathTime: "" }, exists, now)).toMatchObject({
      errors: { deathTime: "timeOrUnknown" },
    });
    const r = validateFinder({ ...valid, deathTime: "", timeUnknown: "on" }, exists, now);
    expect(r.ok && r.data.deathTime).toBe(undefined);
    expect(validateFinder({ ...valid, deathTime: "25:10" }, exists, now)).toMatchObject({
      errors: { deathTime: "invalidTime" },
    });
  });

  it("requires cities from the list", () => {
    expect(validateFinder({ ...valid, deathPlaceId: "999" }, exists, now)).toMatchObject({
      errors: { deathPlaceId: "placeRequired" },
    });
  });

  it("explains that Varshik Shraddha is not available yet", () => {
    expect(validateFinder({ ...valid, kind: "varshik" }, exists, now)).toMatchObject({
      errors: { kind: "varshikSoon" },
    });
  });

  it("limits the year to this year and the next two", () => {
    expect(yearOptions(now)).toEqual([2026, 2027, 2028]);
    expect(validateFinder({ ...valid, year: "2030" }, exists, now)).toMatchObject({ errors: { year: "yearRange" } });
  });

  it("limits text lengths", () => {
    expect(validateFinder({ ...valid, notes: "x".repeat(1001) }, exists, now)).toMatchObject({
      errors: { notes: "tooLong" },
    });
  });
});
