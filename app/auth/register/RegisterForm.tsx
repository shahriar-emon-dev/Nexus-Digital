"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordStrength, scorePassword } from "@/components/auth/PasswordStrength";

const industries = ["FinTech", "SaaS", "Healthcare", "E-commerce", "Other"];

type Field = "fullName" | "email" | "company" | "industry" | "phone" | "password" | "terms";
type Errors = Partial<Record<Field, string>>;
type Status = "idle" | "submitting" | "done";

/** Visual order, so focus after a failed submit follows the reading order. */
const ORDER: Field[] = ["fullName", "email", "company", "industry", "phone", "password", "terms"];

export function RegisterForm() {
  const [values, setValues] = React.useState({
    fullName: "",
    email: "",
    company: "",
    industry: "",
    phone: "",
    password: "",
    terms: false,
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [status, setStatus] = React.useState<Status>("idle");

  const clear = (key: Field) => setErrors((p) => ({ ...p, [key]: undefined }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: Errors = {};
    if (!values.fullName.trim()) found.fullName = "Tell us who you are.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(values.email))
      found.email = "Enter a valid work email.";
    if (!values.company.trim()) found.company = "Company name is required.";
    if (!values.industry) found.industry = "Choose an industry.";
    if (values.phone.replace(/\D/g, "").length < 7) found.phone = "Enter a reachable number.";
    // The source only used `required`, so "a" passed while the meter said Weak.
    if (scorePassword(values.password) < 3)
      found.password = "Use 9+ characters with a capital, a number and a symbol.";
    if (!values.terms) found.terms = "You need to accept the agreement to continue.";

    setErrors(found);
    if (Object.keys(found).length) {
      const first = ORDER.find((k) => found[k]);
      if (first) document.getElementById(first)?.focus();
      return;
    }

    setStatus("submitting");
    // TODO: POST to a real registration endpoint / NextAuth provider.
    await new Promise((r) => setTimeout(r, 1400));
    setStatus("done");
  };

  const busy = status !== "idle";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field id="fullName" label="Full Name" error={errors.fullName}>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="John Doe"
            value={values.fullName}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            onChange={(e) => {
              setValues((v) => ({ ...v, fullName: e.target.value }));
              clear("fullName");
            }}
          />
        </Field>

        <Field id="email" label="Work Email" error={errors.email}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="john@company.com"
            value={values.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            onChange={(e) => {
              setValues((v) => ({ ...v, email: e.target.value }));
              clear("email");
            }}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field id="company" label="Company Name" error={errors.company}>
          <Input
            id="company"
            autoComplete="organization"
            placeholder="Nexus Digital"
            value={values.company}
            aria-invalid={Boolean(errors.company)}
            aria-describedby={errors.company ? "company-error" : undefined}
            onChange={(e) => {
              setValues((v) => ({ ...v, company: e.target.value }));
              clear("company");
            }}
          />
        </Field>

        <Field id="industry" label="Industry" error={errors.industry}>
          <Select
            value={values.industry}
            onValueChange={(value) => {
              setValues((v) => ({ ...v, industry: String(value) }));
              clear("industry");
            }}
          >
            <SelectTrigger id="industry" aria-labelledby="industry-label">
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field id="phone" label="Phone Number" error={errors.phone}>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+1 (555) 000-0000"
          value={values.phone}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "phone-error" : undefined}
          onChange={(e) => {
            setValues((v) => ({ ...v, phone: e.target.value }));
            clear("phone");
          }}
        />
      </Field>

      <Field id="password" label="Password" error={errors.password}>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          value={values.password}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          onChange={(e) => {
            setValues((v) => ({ ...v, password: e.target.value }));
            clear("password");
          }}
        />
        <PasswordStrength value={values.password} />
      </Field>

      <div className="mt-4 flex items-start gap-3">
        <Checkbox
          id="terms"
          checked={values.terms}
          aria-invalid={Boolean(errors.terms)}
          aria-describedby={errors.terms ? "terms-error" : undefined}
          onCheckedChange={(checked) => {
            setValues((v) => ({ ...v, terms: Boolean(checked) }));
            clear("terms");
          }}
        />
        <div>
          <label htmlFor="terms" className="cursor-pointer text-sm leading-tight text-ink-tertiary">
            I agree to the{" "}
            <Link href="/terms" className="text-brand hover:underline">
              Nexus Master Services Agreement
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-brand hover:underline">
              Privacy Policy
            </Link>
            .
          </label>
          {errors.terms && (
            <p id="terms-error" className="mt-1 text-xs font-medium text-danger">
              {errors.terms}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        size="xl"
        disabled={busy}
        className={cn(
          "mt-6 w-full tracking-widest uppercase",
          status === "done" && "bg-success text-canvas disabled:opacity-100"
        )}
      >
        {status === "idle" && "Create Account"}
        {status === "submitting" && (
          <>
            <Loader2 className="animate-spin motion-reduce:animate-none" />
            Initializing…
          </>
        )}
        {status === "done" && (
          <>
            <CheckCircle2 />
            Workspace provisioning
          </>
        )}
      </Button>

      {/* The source used a browser `alert()` for the success path. */}
      <p aria-live="polite" className="sr-only">
        {status === "submitting" && "Creating your account."}
        {status === "done" && "Account created. Your client portal is being provisioned."}
      </p>

      <p className="mt-8 text-center text-[0.8125rem] text-ink-tertiary">
        Already have an account?
        <Link href="/auth/login" className="ml-2 font-semibold text-brand hover:underline">
          Log In
        </Link>
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label id={`${id}-label`} htmlFor={id} className="tracking-[0.05em] text-brand uppercase">
        {label}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
