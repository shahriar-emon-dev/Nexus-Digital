"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { anchoredMotion, popupSurface } from "./motion";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;
const SelectGroup = SelectPrimitive.Group;

function SelectTrigger({
  className,
  children,
  size = "default",
  ...props
}: SelectPrimitive.Trigger.Props & { size?: "sm" | "default" }) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg border border-line-strong bg-surface-sunken text-ink",
        "transition-[border-color,box-shadow] duration-(--duration-fast) ease-(--ease-out-quint)",
        "hover:border-brand-line/70",
        "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "data-popup-open:border-brand data-popup-open:ring-2 data-popup-open:ring-brand/25",
        size === "sm" ? "h-8 px-2.5 text-[0.8125rem]" : "h-9.5 px-3 text-sm",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="text-ink-tertiary">
        <ChevronsUpDown className="size-3.5" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({ className, children, ...props }: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        className="z-50"
        sideOffset={6}
        alignItemWithTrigger={false}
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            popupSurface,
            "max-h-(--available-height) min-w-(--anchor-width) overflow-y-auto p-1.5",
            anchoredMotion,
            className
          )}
          {...props}
        >
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({ className, children, ...props }: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-md py-2 pr-2.5 pl-8 text-sm outline-none select-none",
        "text-ink-secondary transition-colors duration-(--duration-instant)",
        "data-highlighted:bg-brand-subtle data-highlighted:text-brand-subtle-fg",
        "data-selected:font-medium data-selected:text-ink",
        "data-disabled:pointer-events-none data-disabled:opacity-45",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="absolute left-2.5 flex items-center text-brand">
        <Check className="size-3.5" />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectGroupLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-group-label"
      className={cn(
        "px-2.5 pt-2 pb-1.5 text-overline font-semibold tracking-(--text-overline--letter-spacing) text-ink-tertiary uppercase",
        className
      )}
      {...props}
    />
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("-mx-1.5 my-1.5 h-px bg-line", className)} {...props} />;
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectGroupLabel,
  SelectSeparator,
};
