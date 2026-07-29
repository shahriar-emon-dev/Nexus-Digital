"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { backdropMotion, centredMotion, sheetMotion } from "./motion";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogContent({
  className,
  children,
  showClose = true,
  size = "default",
  ...props
}: DialogPrimitive.Popup.Props & {
  showClose?: boolean;
  size?: "sm" | "default" | "lg" | "xl";
}) {
  const widths = {
    sm: "max-w-sm",
    default: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  } as const;

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className={backdropMotion} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2",
          "max-h-[calc(100svh-3rem)] overflow-y-auto",
          "rounded-2xl border border-line bg-surface-raised shadow-e4 outline-none",
          widths[size],
          centredMotion,
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            aria-label="Close dialog"
            className={cn(
              "absolute top-4 right-4 grid size-8 place-items-center rounded-md",
              "text-ink-tertiary transition-colors duration-(--duration-fast)",
              "hover:bg-surface-sunken hover:text-ink",
              "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
            )}
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 p-6 pb-0", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-heading text-lg leading-tight font-semibold text-ink", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm leading-relaxed text-ink-tertiary", className)}
      {...props}
    />
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-body" className={cn("p-6", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 border-t border-line-subtle px-6 py-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
}

/** Edge-anchored dialog — used for mobile navigation and detail panels. */
function Sheet({
  className,
  children,
  side = "right",
  showClose = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  side?: "left" | "right" | "top" | "bottom";
  showClose?: boolean;
}) {
  const position = {
    left: "inset-y-0 left-0 h-full w-[min(22rem,88vw)] border-r rounded-r-2xl",
    right: "inset-y-0 right-0 h-full w-[min(22rem,88vw)] border-l rounded-l-2xl",
    top: "inset-x-0 top-0 w-full max-h-[85svh] border-b rounded-b-2xl",
    bottom: "inset-x-0 bottom-0 w-full max-h-[85svh] border-t rounded-t-2xl",
  }[side];

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className={backdropMotion} />
      <DialogPrimitive.Popup
        data-slot="sheet"
        className={cn(
          "fixed z-50 flex flex-col overflow-y-auto border-line bg-surface shadow-e4 outline-none",
          position,
          sheetMotion(side),
          className
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            aria-label="Close panel"
            className="absolute top-4 right-4 grid size-8 place-items-center rounded-md text-ink-tertiary transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  Sheet,
};
