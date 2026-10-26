// All dates are local calendar days stored as YYYY-MM-DD strings.
export function toDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDay(new Date());
}

export function parseDay(s: string): Date {
  const [y = 1970, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = parseDay(s);
  d.setDate(d.getDate() + n);
  return toDay(d);
}

export function startOfWeek(s: string): string {
  const d = parseDay(s);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  return addDays(s, -dow);
}

export type Recurrence = "none" | "daily" | "weekdays" | "weekly" | "monthly";

/** Next due date for a recurring task after it is completed. Null when not recurring. */
export function nextDueDate(due: string | null, recurrence: string, today: string): string | null {
  if (recurrence === "none") return null;
  const base = due ?? today;
  if (recurrence === "daily") return addDays(base, 1);
  if (recurrence === "weekly") return addDays(base, 7);
  if (recurrence === "weekdays") {
    let next = addDays(base, 1);
    while ([0, 6].includes(parseDay(next).getDay())) next = addDays(next, 1);
    return next;
  }
  if (recurrence === "monthly") {
    const d = parseDay(base);
    const targetMonth = d.getMonth() + 1;
    const n = new Date(d.getFullYear(), targetMonth, d.getDate());
    if (n.getMonth() !== targetMonth % 12) n.setDate(0); // clamp to month end
    return toDay(n);
  }
  return null;
}

export const DAILY_CHERRY_CAP = 10;

/** One cherry per completed task, capped per day so rewards never push overworking. */
export function cherriesForCompletion(completedToday: number, rewardsEnabled: boolean): number {
  if (!rewardsEnabled) return 0;
  return completedToday < DAILY_CHERRY_CAP ? 1 : 0;
}

export function prettyDate(s: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }) {
  return parseDay(s).toLocaleDateString(undefined, opts);
}
