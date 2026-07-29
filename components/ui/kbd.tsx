import * as React from "react";

import { cn } from "@/lib/utils";

/** Keyboard hint. Renders ⌘ on Apple platforms and Ctrl elsewhere. */
function Kbd({ className, children, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-[5px] px-1.5",
        "border border-line-strong bg-surface-sunken",
        "font-mono text-[0.6875rem] font-medium text-ink-tertiary",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}

export { Kbd };
