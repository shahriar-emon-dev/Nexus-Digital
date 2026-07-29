import * as React from "react";
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-sunken align-middle select-none",
  {
    variants: {
      size: {
        xs: "size-6 text-[0.625rem]",
        sm: "size-8 text-xs",
        default: "size-9.5 text-[0.8125rem]",
        lg: "size-12 text-sm",
        xl: "size-16 text-lg",
      },
      ring: {
        true: "ring-2 ring-surface",
        false: "",
      },
    },
    defaultVariants: { size: "default", ring: false },
  }
);

function Avatar({
  className,
  size,
  ring,
  ...props
}: AvatarPrimitive.Root.Props & VariantProps<typeof avatarVariants>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(avatarVariants({ size, ring, className }))}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("size-full object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center bg-brand-subtle font-medium text-brand-subtle-fg",
        className
      )}
      {...props}
    />
  );
}

/** Overlapping avatar row with an optional "+N" overflow chip. */
function AvatarGroup({
  className,
  max = 4,
  size = "sm",
  people,
  ...props
}: React.ComponentProps<"div"> & {
  max?: number;
  size?: VariantProps<typeof avatarVariants>["size"];
  people: { name: string; src?: string }[];
}) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  return (
    <div
      data-slot="avatar-group"
      className={cn("flex items-center -space-x-2", className)}
      {...props}
    >
      {shown.map((p) => (
        <Avatar key={p.name} size={size} ring title={p.name}>
          {p.src && <AvatarImage src={p.src} alt={p.name} />}
          <AvatarFallback>{initials(p.name)}</AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            avatarVariants({ size, ring: true }),
            "bg-surface-sunken font-medium text-ink-tertiary"
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, initials, avatarVariants };
