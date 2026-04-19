import { cn } from "../lib/utils";

describe("cn", () => {
  it("returns a single class name unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple class names with a space", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignores falsy values", () => {
    expect(cn("base", false && "skip", undefined, null as never, "keep")).toBe(
      "base keep",
    );
  });

  it("handles conditional object syntax", () => {
    expect(cn({ "is-active": true, "is-disabled": false })).toBe("is-active");
  });

  it("deduplicates conflicting Tailwind utilities (last wins)", () => {
    // tailwind-merge resolves p-4 then p-2 → p-2 wins
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("deduplicates conflicting text-color utilities", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("handles array of class names", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });
});
