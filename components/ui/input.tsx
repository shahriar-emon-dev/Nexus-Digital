import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

const fieldSurface = [
  "w-full rounded-lg border border-line-strong bg-surface-sunken text-ink",
  "placeholder:text-ink-tertiary",
  "transition-[border-color,box-shadow,background-color] duration-(--duration-fast) ease-(--ease-out-quint)",
  "hover:border-brand-line/70",
  "focus-visible:border-brand focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-brand/25 focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-danger aria-invalid:ring-2 aria-invalid:ring-danger/20",
];

/**
 * Forwards its ref: without this, callers that manage focus — the one-time-code
 * fields, for instance — get `null` back and every `.focus()` silently does
 * nothing, which looks like the component simply not working.
 */
const Input = React.forwardRef<HTMLInputElement, InputPrimitive.Props>(function Input(
  { className, ...props },
  ref
) {
  return (
    <InputPrimitive
      ref={ref}
      data-slot="input"
      className={cn(
        fieldSurface,
        "h-9.5 px-3 text-sm",
        "file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink",
        className
      )}
      {...props}
    />
  );
});

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(fieldSurface, "min-h-24 resize-y px-3 py-2.5 text-sm", className)}
        {...props}
      />
    );
  }
);

/** Input with a leading icon / trailing affix slot. */
function InputGroup({
  className,
  leading,
  trailing,
  ...props
}: InputPrimitive.Props & {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div data-slot="input-group" className="relative flex items-center">
      {leading && (
        <span className="pointer-events-none absolute left-3 flex items-center text-ink-tertiary [&_svg]:size-4">
          {leading}
        </span>
      )}
      <Input className={cn(leading && "pl-9", trailing && "pr-9", className)} {...props} />
      {trailing && (
        <span className="absolute right-3 flex items-center text-ink-tertiary [&_svg]:size-4">
          {trailing}
        </span>
      )}
    </div>
  );
}

export { Input, Textarea, InputGroup, fieldSurface };
