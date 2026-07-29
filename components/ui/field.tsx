import { Field as FieldPrimitive } from "@base-ui/react/field";
import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset";

import { cn } from "@/lib/utils";

function Field({ className, ...props }: FieldPrimitive.Root.Props) {
  return (
    <FieldPrimitive.Root
      data-slot="field"
      className={cn("flex w-full flex-col gap-1.5", className)}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      data-slot="field-label"
      className={cn(
        "flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-secondary",
        "data-disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      data-slot="field-description"
      className={cn("text-xs leading-relaxed text-ink-tertiary", className)}
      {...props}
    />
  );
}

function FieldError({ className, ...props }: FieldPrimitive.Error.Props) {
  return (
    <FieldPrimitive.Error
      data-slot="field-error"
      className={cn("text-xs font-medium text-danger", className)}
      {...props}
    />
  );
}

const FieldControl = FieldPrimitive.Control;

function Fieldset({ className, ...props }: FieldsetPrimitive.Root.Props) {
  return (
    <FieldsetPrimitive.Root
      data-slot="fieldset"
      className={cn("flex flex-col gap-5", className)}
      {...props}
    />
  );
}

function FieldsetLegend({ className, ...props }: FieldsetPrimitive.Legend.Props) {
  return (
    <FieldsetPrimitive.Legend
      data-slot="fieldset-legend"
      className={cn("font-heading text-sm font-semibold text-ink", className)}
      {...props}
    />
  );
}

/** Standalone label for controls outside a Field.Root. */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink-secondary",
        className
      )}
      {...props}
    />
  );
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldControl,
  Fieldset,
  FieldsetLegend,
  Label,
};
