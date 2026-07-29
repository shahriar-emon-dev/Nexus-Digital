"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";
import { anchoredMotion, popupSurface } from "./motion";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverClose = PopoverPrimitive.Close;

function PopoverContent({
  className,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  ...props
}: PopoverPrimitive.Popup.Props & {
  side?: PopoverPrimitive.Positioner.Props["side"];
  align?: PopoverPrimitive.Positioner.Props["align"];
  sideOffset?: number;
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        className="z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(popupSurface, "w-72 p-4", anchoredMotion, className)}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      className={cn("font-heading text-sm font-semibold text-ink", className)}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      className={cn("text-sm leading-relaxed text-ink-tertiary", className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
  PopoverTitle,
  PopoverDescription,
};
