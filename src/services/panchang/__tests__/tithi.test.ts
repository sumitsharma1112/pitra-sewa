import { describe, expect, it } from "vitest";
import { monthName, parseMonthName, parseTithiName, toTithiIndex } from "../tithi";

describe("parseTithiName", () => {
  it.each([
    ["Pratipada", 1],
    ["Dvitiya", 2],
    ["Tritiya", 3],
    ["Chaturthi", 4],
    ["Panchami", 5],
    ["Shashthi", 6], // regression: contains "asht"
    ["Saptami", 7],
    ["Ashtami", 8],
    ["Navami", 9],
    ["Dashami", 10],
    ["Ekadashi", 11],
    ["Dwadashi", 12],
    ["Trayodashi", 13],
    ["Chaturdashi", 14], // must not read as Chaturthi
  ])("%s → %i", (name, n) => {
    expect(parseTithiName(name).n).toBe(n);
  });

  it("recognises full and new moon spellings", () => {
    expect(parseTithiName("Purnima").fullMoon).toBe(true);
    expect(parseTithiName("Poornima").fullMoon).toBe(true);
    expect(parseTithiName("Amavasya").newMoon).toBe(true);
  });
});

describe("toTithiIndex", () => {
  it("reads the documented ShubhAI example (Dwadashi, 12, Shukla)", () => {
    expect(toTithiIndex({ name: "Dwadashi", number: 12, paksha: "Shukla" })).toBe(12);
  });
  it("accepts Krishna tithis numbered 1–15 or 16–30", () => {
    expect(toTithiIndex({ name: "Dwadashi", number: 12, paksha: "Krishna" })).toBe(27);
    expect(toTithiIndex({ name: "Dwadashi", number: 27, paksha: "Krishna" })).toBe(27);
  });
  it("maps Purnima and Amavasya to 15 and 30", () => {
    expect(toTithiIndex({ name: "Purnima", number: 15, paksha: "Shukla" })).toBe(15);
    expect(toTithiIndex({ name: "Amavasya", number: 30, paksha: "Krishna" })).toBe(30);
    expect(toTithiIndex({ name: "Amavasya", number: 15, paksha: "Krishna" })).toBe(30);
  });
  it("reads the Navamsha name format", () => {
    expect(toTithiIndex({ name: "Shukla Paksha, Chaturthi" })).toBe(4);
    expect(toTithiIndex({ name: "Krishna Paksha, Chaturdashi" })).toBe(29);
  });
  it("rejects inconsistent data instead of guessing", () => {
    expect(toTithiIndex({ name: "Dwadashi", number: 5, paksha: "Shukla" })).toBeUndefined();
    expect(toTithiIndex({ number: 20, paksha: "Shukla" })).toBeUndefined();
    expect(toTithiIndex({ name: "Dwadashi" })).toBeUndefined(); // no paksha
  });
});

describe("lunar months", () => {
  it.each([
    ["Bhadrapada", "bhadrapada"],
    ["Bhadra", "bhadrapada"],
    ["Ashwin", "ashwin"],
    ["Ashvina", "ashwin"],
    ["Ashadha", "ashadha"],
    ["Adhika Shravana", "shravana"],
    ["Margashirsha", "margashirsha"],
    ["Magha", "magha"],
  ])("%s → %s", (raw, month) => {
    expect(parseMonthName(raw)).toBe(month);
  });

  it("gives the Krishna paksha the next month's name in Purnimanta", () => {
    expect(monthName("bhadrapada", "krishna", "purnimanta")).toBe("ashwin");
    expect(monthName("bhadrapada", "krishna", "amanta")).toBe("bhadrapada");
    expect(monthName("bhadrapada", "shukla", "purnimanta")).toBe("bhadrapada");
    expect(monthName("phalguna", "krishna", "purnimanta")).toBe("chaitra");
  });
});
