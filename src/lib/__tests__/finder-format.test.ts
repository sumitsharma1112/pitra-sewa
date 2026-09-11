import { describe, expect, it } from "vitest";
import { plainName, respectfulName } from "../finder-format";

describe("respectfulName", () => {
  it("adds स्व. … जी in Hindi and Late in English", () => {
    expect(respectfulName("राम प्रसाद", "hi")).toBe("स्व. राम प्रसाद जी");
    expect(respectfulName("Ram Prasad", "en")).toBe("Late Ram Prasad");
    expect(respectfulName("Ram Prasad", "en", true)).toBe("the late Ram Prasad");
  });

  it("never doubles honorifics the family already typed", () => {
    expect(respectfulName("स्व. राम प्रसाद जी", "hi")).toBe("स्व. राम प्रसाद जी");
    expect(respectfulName("स्वर्गीय कमला देवी", "hi")).toBe("स्व. कमला देवी जी");
    expect(respectfulName("दिवंगत श्री मोहन लाल", "hi")).toBe("स्व. श्री मोहन लाल जी");
    expect(respectfulName("Late Ram Prasad ji", "en")).toBe("Late Ram Prasad");
    expect(respectfulName("the late  Kamla Devi", "en")).toBe("Late Kamla Devi");
    expect(respectfulName("Lt. Mohan Lal", "en")).toBe("Late Mohan Lal");
  });

  it("does not cut real names that merely start alike", () => {
    expect(plainName("Lata Sharma")).toBe("Lata Sharma");
    expect(plainName("स्वरूप सिंह")).toBe("स्वरूप सिंह");
    expect(plainName("Ramji")).toBe("Ramji");
  });

  it("returns nothing for an empty name", () => {
    expect(respectfulName("", "hi")).toBe("");
    expect(respectfulName("  स्व.  ", "hi")).toBe("");
    expect(respectfulName(undefined, "en")).toBe("");
  });
});
