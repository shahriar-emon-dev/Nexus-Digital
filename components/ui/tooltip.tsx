"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/lib/utils";
import { anchoredMotion } from "./motion";

const TooltipTrigger = TooltipPrimitive.Trigger;
const Tooltip = TooltipPrimitive.Root;

/**
 * Delay lives on the provider in Base UI, not per-tooltip: once one tooltip in a
 * group has opened, its neighbours open instantly. Wrap the app once.
 */
function TooltipProvider({ delay = 280, ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />;
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 8,
  children,
  ...props
}: TooltipPrimitive.Popup.Props & {
  side?: TooltipPrimitive.Positioner.Props["side"];
  sideOffset?: number;
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner side={side} sideOffset={sideOffset} className="z-50">
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 max-w-64 origin-(--transform-origin) rounded-lg border border-line",
            "bg-surface-inverse px-2.5 py-1.5 text-xs font-medium text-ink-inverse shadow-e3",
            anchoredMotion,
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
