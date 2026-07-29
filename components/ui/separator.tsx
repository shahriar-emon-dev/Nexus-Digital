import * as React from "react";
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";

import { cn } from "@/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-line",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  );
}

/** Rule with a centred label — used to break up long forms and settings pages. */
function SeparatorLabel({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center gap-3", className)}
      role="separator"
      {...props}
    >
      <span className="h-px flex-1 bg-line" />
      <span className="text-overline font-semibold tracking-(--text-overline--letter-spacing) text-ink-tertiary uppercase">
        {children}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export { Separator, SeparatorLabel };
