import { describe, it, expect } from "vitest";
import { nextDueDate, cherriesForCompletion } from "./dates";

describe("recurring tasks", () => {
  it("daily moves one day", () => expect(nextDueDate("2026-10-26", "daily", "2026-10-26")).toBe("2026-10-27"));
  it("weekly moves seven days", () => expect(nextDueDate("2026-10-26", "weekly", "2026-10-26")).toBe("2026-11-02"));
  it("weekdays skips the weekend", () => expect(nextDueDate("2026-10-30", "weekdays", "2026-10-30")).toBe("2026-11-02"));
  it("monthly clamps to month end", () => expect(nextDueDate("2026-01-31", "monthly", "2026-01-31")).toBe("2026-02-28"));
  it("non-recurring returns null", () => expect(nextDueDate("2026-10-26", "none", "2026-10-26")).toBeNull());
  it("undated recurring starts from today", () => expect(nextDueDate(null, "daily", "2026-10-26")).toBe("2026-10-27"));
});

describe("cherry rewards", () => {
  it("awards one cherry per completion", () => expect(cherriesForCompletion(0, true)).toBe(1));
  it("stops after 10 per day", () => expect(cherriesForCompletion(10, true)).toBe(0));
  it("awards nothing when rewards are off", () => expect(cherriesForCompletion(0, false)).toBe(0));
});
