"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "grid size-4.5 shrink-0 cursor-pointer place-items-center rounded-[5px]",
        "border border-line-strong bg-surface-sunken text-brand-fg",
        "transition-[background-color,border-color] duration-(--duration-fast) ease-(--ease-out-quint)",
        "hover:border-brand-line",
        "data-checked:border-brand data-checked:bg-brand",
        "data-indeterminate:border-brand data-indeterminate:bg-brand",
        "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none",
        "data-disabled:cursor-not-allowed data-disabled:opacity-45",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex data-unchecked:hidden">
        <Check className="size-3 data-[indeterminate]:hidden" strokeWidth={3.25} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

function CheckboxIndeterminate({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      indeterminate
      className={cn(
        "grid size-4.5 shrink-0 place-items-center rounded-[5px] border border-brand bg-brand text-brand-fg",
        className
      )}
      {...props}
    >
      <Minus className="size-3" strokeWidth={3.25} />
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox, CheckboxIndeterminate };
