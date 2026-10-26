/* Daily-quote widget: pure, deterministic quote selection + SVG card builder. */

export type QuoteCtx = {
  day: string; // YYYY-MM-DD (UTC)
  name?: string | null;
  energy?: string | null;
  wins?: number;
  overdue?: number;
};

const CALM = [
  "Slow is still forward.",
  "Rest is part of the plan, not a break from it.",
  "You don't have to do everything today. One gentle thing is enough.",
  "Today is allowed to be soft.",
  "Small counts. Small always counts.",
];

const MOMENTUM = [
  "Start with the smallest pick. Momentum likes to be invited gently.",
  "You don't need motivation. You need a first little step.",
  "Three little wins are a whole good day.",
  "Progress isn't loud. It sounds like 'okay, that part's done'.",
  "Your future self is quietly grateful right now.",
];

const BOLD = [
  "Your dreams are big. Your next step can be tiny — and still real.",
  "Big things are just small things that kept going.",
  "You're not behind. You're on your own timeline.",
  "The dream doesn't need today to be perfect. It needs today at all.",
  "Go be impressive in your own quiet way.",
];

const OVERDUE = [
  "Yesterday is over. Today gets a fresh page.",
  "Nothing about you is late. Some things are simply still waiting.",
  "The list doesn't define you. It waits politely. That's all.",
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickQuote(ctx: QuoteCtx): { quote: string; note: string } {
  const seed = hash(`${ctx.day}:${ctx.energy ?? ""}:${ctx.wins ?? 0}`);
  let pool = MOMENTUM;
  if (ctx.energy === "low") pool = CALM;
  else if (ctx.energy === "high") pool = BOLD;
  const quote = pool[seed % pool.length];
  const alt = hash(ctx.day) % 100;
  let note = "— cherrymind, your daily page";
  if (ctx.overdue && ctx.overdue > 0 && alt < 25) note = OVERDUE[alt % OVERDUE.length];
  else if ((ctx.wins ?? 0) > 0 && alt < 50) {
    const w = ctx.wins ?? 0;
    note = w === 1 ? "You've done one little thing today already. That counts." : `You've done ${w} little things today already. That counts.`;
  } else if (ctx.energy === "low") note = "Low-energy days are for tiny steps, not for proving anything.";
  return { quote, note };
}

function esc(s: string): string {
  const amp = "&" + "amp;";
  const lt = "&" + "lt;";
  const gt = "&" + "gt;";
  return s.replace(/&/g, amp).replace(/</g, lt).replace(/>/g, gt);
}

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > maxChars) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function pretty(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${d}, ${y}`;
}

/** Deterministic SVG card for the daily-quote widget link. */
export function buildQuoteCard(ctx: QuoteCtx): string {
  const { quote, note } = pickQuote(ctx);
  const lines = wrap(quote, 34);
  const y0 = 168 - (lines.length - 1) * 16;
  const who = ctx.name ? `for ${esc(ctx.name.split(" ")[0])}` : "for you";
  const body = lines.map((l, i) => `<text x="300" y="${y0 + i * 34}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="24" font-style="italic" fill="#4D2633">${esc(l)}</text>`).join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">
  <defs>
    <clipPath id="r"><rect width="600" height="360" rx="24"/></clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="600" height="360" fill="#FFFAF7"/>
    <rect x="12" y="12" width="576" height="336" rx="18" fill="#FFF0F3" opacity="0.7"/>
    <text x="300" y="66" text-anchor="middle" font-family="Verdana, Geneva, sans-serif" font-size="13" letter-spacing="4" fill="#A30D2D">${esc(pretty(ctx.day).toUpperCase())}</text>
    <line x1="240" y1="88" x2="360" y2="88" stroke="#EFA3B6" stroke-width="2" stroke-linecap="round"/>
    ${body}
    <text x="300" y="${y0 + lines.length * 34 + 26}" text-anchor="middle" font-family="Verdana, Geneva, sans-serif" font-size="13" fill="#760F29">${esc(note)}</text>
    <circle cx="300" cy="316" r="6" fill="#A30D2D"/>
    <text x="300" y="340" text-anchor="middle" font-family="Verdana, Geneva, sans-serif" font-size="12" letter-spacing="2" fill="#EFA3B6">CHERRYMIND ${esc(who.toUpperCase())}</text>
  </g>
</svg>`;
}
