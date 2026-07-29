"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({
  className,
  variant = "pill",
  ...props
}: TabsPrimitive.List.Props & { variant?: "pill" | "underline" }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        "relative flex items-center",
        variant === "pill"
          ? "w-fit gap-1 rounded-xl border border-line bg-surface-sunken p-1"
          : "gap-6 border-b border-line",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative z-10 inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap",
        "text-sm font-medium text-ink-tertiary outline-none select-none",
        "transition-colors duration-(--duration-fast) ease-(--ease-out-quint)",
        "hover:text-ink-secondary data-selected:text-ink",
        "focus-visible:ring-2 focus-visible:ring-brand/50",
        "disabled:pointer-events-none disabled:opacity-45",
        "[&_svg]:size-4",
        // pill
        "in-data-[variant=pill]:rounded-lg in-data-[variant=pill]:px-3.5 in-data-[variant=pill]:py-1.5",
        // underline
        "in-data-[variant=underline]:-mb-px in-data-[variant=underline]:border-b-2 in-data-[variant=underline]:border-transparent in-data-[variant=underline]:pb-3",
        "in-data-[variant=underline]:data-selected:border-brand",
        className
      )}
      {...props}
    />
  );
}

/** The sliding highlight behind the selected pill. */
function TabsIndicator({ className, ...props }: TabsPrimitive.Indicator.Props) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      className={cn(
        "absolute top-1/2 left-0 z-0 h-(--active-tab-height) w-(--active-tab-width)",
        "-translate-y-1/2 translate-x-(--active-tab-left) rounded-lg bg-surface shadow-e1",
        "transition-all duration-(--duration-normal) ease-(--ease-out-quint)",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("mt-5 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsIndicator, TabsContent };
