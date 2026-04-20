import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("merges class names and keeps the latest conflicting utility", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("ignores falsey values", () => {
    expect(cn("text-sm", undefined, false && "hidden", null)).toBe("text-sm");
  });
});
