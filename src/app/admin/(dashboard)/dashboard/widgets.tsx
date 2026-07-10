import type { ReactNode } from "react";

/**
 * Compact metric tile: an icon, a big value and a label, with a subtle
 * gradient accent bar on top. Optionally shows a small hint line.
 */
export function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-violet to-accent" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display text-3xl text-primary tabular-nums">{value}</div>
          <div className="mt-1 text-xs uppercase tracking-wide text-muted">{label}</div>
          {hint && <div className="mt-1 truncate text-xs text-foreground/50">{hint}</div>}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-primary-dark">
          {icon}
        </span>
      </div>
    </div>
  );
}

/**
 * Highlights a single dish (its name + price), used for the priciest / cheapest
 * tiles. `tone` shifts the accent colour so the two read differently.
 */
export function PriceHighlightCard({
  title,
  name,
  price,
  icon,
  tone = "primary",
}: {
  title: string;
  name: string | null;
  price: string;
  icon: ReactNode;
  tone?: "primary" | "accent";
}) {
  const ring =
    tone === "accent"
      ? "from-accent/15 to-gold/10 text-accent"
      : "from-primary/15 to-violet/10 text-primary";

  return (
    <div className="card-soft flex items-center gap-4 p-5 hover:translate-y-0">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${ring}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wide text-muted">{title}</div>
        <div className="truncate font-display text-lg text-foreground">
          {name ?? "Keine Speise mit Preis"}
        </div>
      </div>
      <div className="shrink-0 font-display text-xl text-primary tabular-nums">{price}</div>
    </div>
  );
}

/* --- Inline icons (no dependency) --- */

function svg(children: ReactNode) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconLayers = () =>
  svg(
    <>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </>,
  );
export const IconDish = () =>
  svg(
    <>
      <path d="M3 11a9 9 0 0 1 18 0Z" />
      <path d="M2 11h20" />
      <path d="M12 3v2" />
    </>,
  );
export const IconAverage = () =>
  svg(
    <>
      <path d="M4 20 20 4" />
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
    </>,
  );
export const IconTrendUp = () =>
  svg(
    <>
      <path d="M3 17 9 11l4 4 8-8" />
      <path d="M17 7h4v4" />
    </>,
  );
export const IconTrendDown = () =>
  svg(
    <>
      <path d="M3 7 9 13l4-4 8 8" />
      <path d="M17 17h4v-4" />
    </>,
  );
