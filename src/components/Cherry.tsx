export function CherryIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 3c-1 6-4 10-8 14M16 3c1 5 3 10 7 14" stroke="var(--color-burgundy)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M16 3c3-1 6 0 8 2-3 1-6 0-8-2z" fill="var(--color-area-studies)" opacity=".0" />
      <path d="M16 4c2.5-2 6-2 8 0-2.5 1.5-5.5 1.5-8 0z" fill="oklch(0.65 0.12 140)" />
      <circle cx="8" cy="21" r="6" fill="var(--color-primary)" />
      <circle cx="23" cy="21" r="6" fill="var(--color-primary)" />
      <circle cx="6" cy="19" r="1.6" fill="var(--color-powder)" opacity=".8" />
      <circle cx="21" cy="19" r="1.6" fill="var(--color-powder)" opacity=".8" />
    </svg>
  );
}

export function Sparkle({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`deco ${className}`} aria-hidden="true">
      <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="var(--color-strawberry)" />
    </svg>
  );
}

export function CherryCheck({ checked }: { checked: boolean }) {
  return (
    <span
      className={`grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors ${
        checked ? "border-primary bg-primary animate-pop" : "border-strawberry bg-card"
      }`}
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
          <path d="M3 8.5l3 3 7-7" stroke="var(--color-primary-foreground)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-semibold text-burgundy md:text-4xl">
          {title} <Sparkle className="size-5 animate-floaty" />
        </h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}
