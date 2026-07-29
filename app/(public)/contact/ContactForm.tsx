"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Rocket } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const services = [
  "Digital Strategy",
  "UI/UX Engineering",
  "Blockchain Solutions",
  "AI Integration",
] as const;

type Errors = Partial<Record<"fullName" | "email" | "brief", string>>;
type Status = "idle" | "submitting" | "sent";

export function ContactForm() {
  const [values, setValues] = React.useState({
    fullName: "",
    email: "",
    service: services[0] as string,
    brief: "",
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [status, setStatus] = React.useState<Status>("idle");

  /** Fields in visual order — focus follows the order the user reads. */
  const order: (keyof Errors)[] = ["fullName", "email", "brief"];

  const validate = (): Errors => {
    const next: Errors = {};
    if (!values.fullName.trim()) next.fullName = "Tell us who you are.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(values.email))
      next.email = "Enter a valid email address.";
    if (values.brief.trim().length < 20)
      next.brief = "A sentence or two about the project, please.";
    return next;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);

    if (Object.keys(found).length) {
      // Move focus to the first problem rather than leaving the user to hunt.
      // Resolved from the id at submit time — a ref callback would not have run
      // yet, since the error state that reveals it renders after this handler.
      const first = order.find((key) => found[key]);
      if (first) document.getElementById(first)?.focus();
      return;
    }

    setStatus("submitting");
    // TODO: POST to a real endpoint. Nothing leaves the browser today.
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setStatus("sent");

    setTimeout(() => {
      setValues({ fullName: "", email: "", service: services[0], brief: "" });
      setStatus("idle");
    }, 3000);
  };

  const field = (key: keyof Errors) => ({
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
      if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
  });

  const busy = status !== "idle";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName" className="tracking-[0.05em] text-brand uppercase">
            Full name
          </Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            placeholder="John Doe"
            value={values.fullName}
            {...field("fullName")}
          />
          {errors.fullName && (
            <p id="fullName-error" className="text-xs font-medium text-danger">
              {errors.fullName}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="tracking-[0.05em] text-brand uppercase">
            Email address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="john@nexus.digital"
            value={values.email}
            {...field("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-xs font-medium text-danger">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span
          id="service-label"
          className="text-[0.8125rem] font-medium tracking-[0.05em] text-brand uppercase"
        >
          Service interest
        </span>
        <Select
          name="service"
          value={values.service}
          onValueChange={(value) => setValues((v) => ({ ...v, service: String(value) }))}
        >
          <SelectTrigger aria-labelledby="service-label">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service} value={service}>
                {service}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="brief" className="tracking-[0.05em] text-brand uppercase">
          Project brief
        </Label>
        <Textarea
          id="brief"
          name="brief"
          rows={5}
          placeholder="Tell us about your vision…"
          className="resize-none"
          value={values.brief}
          {...field("brief")}
        />
        {errors.brief && (
          <p id="brief-error" className="text-xs font-medium text-danger">
            {errors.brief}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="xl"
        disabled={busy}
        className={cn(
          "w-full",
          status === "sent" && "bg-success text-canvas disabled:opacity-100"
        )}
      >
        {status === "idle" && (
          <>
            Initialize connection
            <Rocket />
          </>
        )}
        {status === "submitting" && (
          <>
            <Loader2 className="animate-spin motion-reduce:animate-none" />
            Transmitting…
          </>
        )}
        {status === "sent" && (
          <>
            <CheckCircle2 />
            Signal received
          </>
        )}
      </Button>

      {/* The button's own label changes, but a changing label is not reliably
          announced. This region is. */}
      <p aria-live="polite" className="sr-only">
        {status === "submitting" && "Sending your message."}
        {status === "sent" && "Message sent. We'll be in touch shortly."}
      </p>
    </form>
  );
}
