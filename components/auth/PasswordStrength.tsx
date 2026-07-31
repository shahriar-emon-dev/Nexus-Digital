"use client";

import { cn } from "@/lib/utils";

const LEVELS = [
  { label: "Weak", bar: "bg-danger", text: "text-danger" },
  { label: "Fair", bar: "bg-warning", text: "text-warning" },
  { label: "Strong", bar: "bg-ion", text: "text-ion" },
  { label: "Impermeable", bar: "bg-success", text: "text-success" },
] as const;

export function scorePassword(value: string) {
  let score = 0;
  if (value.length > 0) score++;
  if (value.length > 8) score++;
  if (/[A-Z]/.test(value) && /[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  return score;
}

/**
 * Password strength meter.
 *
 * The source drove this by swapping Tailwind classes with `classList.replace`,
 * which silently no-ops when the class it expects is not present — so a bar
 * could stick on a stale colour. Strength is derived from the value here, and
 * announced in an `aria-live` region because a row of coloured bars means
 * nothing to a screen reader.
 */
export function PasswordStrength({ value }: { value: string }) {
  const score = scorePassword(value);
  const level = score > 0 ? LEVELS[score - 1] : null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[0.625rem] tracking-tight text-ink-tertiary uppercase">
          Security strength
        </span>
        <span
          className={cn(
            "text-[0.625rem] tracking-tight uppercase",
            level ? level.text : "text-ink-tertiary"
          )}
        >
          {level?.label ?? "None"}
        </span>
      </div>

      <div className="flex h-1 w-full gap-1 overflow-hidden rounded-full" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-full w-1/4 rounded-full transition-colors duration-(--duration-normal)",
              level && i < score ? level.bar : "bg-line"
            )}
          />
        ))}
      </div>

      <p aria-live="polite" className="sr-only">
        {value ? `Password strength: ${level?.label}.` : ""}
      </p>
    </div>
  );
}
