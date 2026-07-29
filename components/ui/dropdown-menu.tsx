"use client";

import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Check, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { anchoredMotion, popupSurface } from "./motion";

const DropdownMenu = MenuPrimitive.Root;
const DropdownMenuTrigger = MenuPrimitive.Trigger;
const DropdownMenuGroup = MenuPrimitive.Group;
const DropdownMenuSub = MenuPrimitive.SubmenuRoot;

const itemBase = [
  "relative flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none select-none",
  "text-ink-secondary transition-colors duration-(--duration-instant)",
  "data-highlighted:bg-brand-subtle data-highlighted:text-brand-subtle-fg",
  "data-disabled:pointer-events-none data-disabled:opacity-45",
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
];

function DropdownMenuContent({
  className,
  side = "bottom",
  align = "end",
  sideOffset = 6,
  ...props
}: MenuPrimitive.Popup.Props & {
  side?: MenuPrimitive.Positioner.Props["side"];
  align?: MenuPrimitive.Positioner.Props["align"];
  sideOffset?: number;
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="z-50"
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            popupSurface,
            "min-w-52 p-1.5",
            "max-h-(--available-height) overflow-y-auto",
            anchoredMotion,
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  destructive,
  ...props
}: MenuPrimitive.Item.Props & { destructive?: boolean }) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        itemBase,
        destructive &&
          "text-danger data-highlighted:bg-danger-subtle data-highlighted:text-danger",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: MenuPrimitive.CheckboxItem.Props) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(itemBase, "pl-8", className)}
      {...props}
    >
      <MenuPrimitive.CheckboxItemIndicator className="absolute left-2.5 flex items-center">
        <Check className="size-3.5" />
      </MenuPrimitive.CheckboxItemIndicator>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(itemBase, "pl-8", className)}
      {...props}
    >
      <MenuPrimitive.RadioItemIndicator className="absolute left-3 flex items-center">
        <span className="size-2 rounded-full bg-current" />
      </MenuPrimitive.RadioItemIndicator>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({ className, ...props }: MenuPrimitive.GroupLabel.Props) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      className={cn(
        "px-2.5 pt-2 pb-1.5 text-overline font-semibold tracking-(--text-overline--letter-spacing) text-ink-tertiary uppercase",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1.5 my-1.5 h-px bg-line", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn("ml-auto font-mono text-[0.6875rem] text-ink-tertiary", className)}
      {...props}
    />
  );
}

function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      className={cn(itemBase, "data-popup-open:bg-surface-sunken", className)}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto size-3.5" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

function DropdownMenuSubContent({ className, ...props }: MenuPrimitive.Popup.Props) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner side="right" align="start" sideOffset={4} className="z-50">
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-sub-content"
          className={cn(popupSurface, "min-w-44 p-1.5", anchoredMotion, className)}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
