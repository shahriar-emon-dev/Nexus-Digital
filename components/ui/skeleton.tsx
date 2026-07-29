import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Loading placeholder. Always sized to the content it stands in for — a
 * skeleton that doesn't match the real layout causes a jump on load, which is
 * worse than no skeleton at all.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("shimmer rounded-md motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5"
          style={{ width: i === lines - 1 ? "62%" : "100%" }}
        />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonText };
