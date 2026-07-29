"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "relative inline-flex h-5.5 w-9.5 shrink-0 cursor-pointer items-center rounded-full p-0.5",
        "border border-line-strong bg-surface-sunken",
        "transition-[background-color,border-color] duration-(--duration-fast) ease-(--ease-out-quint)",
        "data-checked:border-brand data-checked:bg-brand",
        "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none",
        "data-disabled:cursor-not-allowed data-disabled:opacity-45",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "size-4 rounded-full bg-ink-tertiary shadow-e1",
          "transition-[translate,background-color] duration-(--duration-fast) ease-(--ease-out-quint)",
          "data-checked:translate-x-4 data-checked:bg-brand-fg"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
