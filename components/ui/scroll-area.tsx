"use client";

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn } from "@/lib/utils";

function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaPrimitive.Root.Props) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport className="size-full overscroll-contain rounded-[inherit] focus-visible:outline-none">
        <ScrollAreaPrimitive.Content>{children}</ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className={cn(
          "m-1 flex w-1.5 justify-center rounded-full opacity-0",
          "transition-opacity duration-(--duration-normal)",
          "data-hovering:opacity-100 data-scrolling:opacity-100"
        )}
      >
        <ScrollAreaPrimitive.Thumb className="w-full rounded-full bg-line-strong" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Scrollbar
        orientation="horizontal"
        className={cn(
          "m-1 flex h-1.5 items-center rounded-full opacity-0",
          "transition-opacity duration-(--duration-normal)",
          "data-hovering:opacity-100 data-scrolling:opacity-100"
        )}
      >
        <ScrollAreaPrimitive.Thumb className="h-full rounded-full bg-line-strong" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  );
}

export { ScrollArea };
