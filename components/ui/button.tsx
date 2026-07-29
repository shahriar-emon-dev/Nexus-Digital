import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "rounded-lg border border-transparent bg-clip-padding font-medium select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-(--duration-fast) ease-(--ease-out-quint)",
    "outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-45",
    "aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/25",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        // The one button that carries brand weight. Everything else is quieter.
        default:
          "bg-brand text-brand-fg shadow-e1 hover:bg-brand-hover hover:shadow-e2 active:shadow-e1",
        ion: "bg-ion text-ion-fg shadow-e1 hover:brightness-110 hover:shadow-e2",
        outline:
          "border-line-strong bg-surface text-ink hover:border-brand-line hover:bg-brand-subtle hover:text-brand-subtle-fg aria-expanded:bg-brand-subtle",
        secondary:
          "bg-secondary text-ink hover:bg-line-strong aria-expanded:bg-line-strong",
        ghost:
          "text-ink-secondary hover:bg-surface-sunken hover:text-ink aria-expanded:bg-surface-sunken aria-expanded:text-ink",
        subtle: "bg-brand-subtle text-brand-subtle-fg hover:brightness-105",
        destructive:
          "bg-danger-subtle text-danger hover:bg-danger hover:text-canvas focus-visible:ring-danger/50",
        link: "h-auto p-0 text-brand underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md px-3 text-[0.8125rem]",
        default: "h-9.5 px-4 text-sm",
        lg: "h-11 rounded-xl px-5 text-[0.9375rem]",
        xl: "h-13 rounded-xl px-7 text-base [&_svg:not([class*='size-'])]:size-5",
        icon: "size-9.5",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-11 rounded-xl",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

type ButtonProps = ButtonPrimitive.Props & VariantProps<typeof buttonVariants>;

/**
 * `forwardRef` is not optional here: Base UI triggers (Dialog, Popover, Menu,
 * Tooltip) attach a ref to whatever they render, and they need the DOM node to
 * anchor the popup and manage focus. A plain function component silently drops
 * that ref and React warns at runtime.
 *
 * A `render` target that is not a native `<button>` — in practice `<Link />` —
 * is styled directly rather than being passed through the Base UI primitive.
 * The primitive would either warn (its `nativeButton` default assumes a real
 * button) or, with `nativeButton={false}`, stamp `role="button"` over an anchor.
 * Both are wrong for navigation: an `<a href>` is already keyboard-operable,
 * and calling it a button makes assistive tech announce a page move as an
 * action, and hides "open in new tab" affordances.
 */
const Button = React.forwardRef<HTMLElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", render, ...props },
  ref
) {
  const classes = cn(buttonVariants({ variant, size, className }));

  if (React.isValidElement(render) && render.type !== "button") {
    const element = render as React.ReactElement<Record<string, unknown>>;
    return React.cloneElement(element, {
      ...props,
      ref,
      "data-slot": "button",
      className: cn(element.props.className as string | undefined, classes),
    } as never);
  }

  return (
    <ButtonPrimitive ref={ref} data-slot="button" render={render} className={classes} {...props} />
  );
});

export { Button, buttonVariants };
export type { ButtonProps };
