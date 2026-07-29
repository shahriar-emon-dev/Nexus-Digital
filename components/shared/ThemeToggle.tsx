"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

const options = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "System", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
] as const;

/**
 * A three-way segmented control rather than a toggle: "system" is a real user
 * choice, and a two-state toggle silently discards it.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface-sunken p-0.5",
        className
      )}
    >
      {options.map(({ value, label, Icon }) => {
        // Before mount the stored theme is unknown; render all three unselected
        // rather than flashing the wrong one.
        const selected = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "grid size-7 place-items-center rounded-md transition-colors duration-(--duration-fast)",
              "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
              selected
                ? "bg-surface text-ink shadow-e1"
                : "text-ink-tertiary hover:text-ink-secondary"
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
