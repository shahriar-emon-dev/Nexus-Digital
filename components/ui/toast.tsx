"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;
const useToast = ToastPrimitive.useToastManager;

/** Status is carried by icon + label, never by colour alone. */
const toneMap = {
  success: { icon: CheckCircle2, cls: "text-success", label: "Success" },
  warning: { icon: AlertTriangle, cls: "text-warning", label: "Warning" },
  error: { icon: XCircle, cls: "text-danger", label: "Error" },
  info: { icon: Info, cls: "text-info", label: "Info" },
} as const;

function ToastViewport() {
  const { toasts } = ToastPrimitive.useToastManager();

  return (
    <ToastPrimitive.Portal>
      <ToastPrimitive.Viewport className="fixed right-4 bottom-4 z-100 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => {
          const tone = toneMap[(toast.type as keyof typeof toneMap) ?? "info"] ?? toneMap.info;
          const Icon = tone.icon;
          return (
            <ToastPrimitive.Root
              key={toast.id}
              toast={toast}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border border-line bg-surface-raised p-3.5 shadow-e4",
                "transition-[opacity,transform] duration-(--duration-normal) ease-(--ease-out-expo)",
                "data-[starting-style]:translate-x-4 data-[starting-style]:opacity-0",
                "data-[ending-style]:translate-x-4 data-[ending-style]:opacity-0"
              )}
            >
              <Icon className={cn("mt-0.5 size-4 shrink-0", tone.cls)} aria-hidden />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <ToastPrimitive.Title className="text-sm font-semibold text-ink">
                  <span className="sr-only">{tone.label}: </span>
                  {toast.title}
                </ToastPrimitive.Title>
                {toast.description && (
                  <ToastPrimitive.Description className="text-[0.8125rem] leading-relaxed text-ink-tertiary">
                    {toast.description}
                  </ToastPrimitive.Description>
                )}
              </div>
              <ToastPrimitive.Close
                aria-label="Dismiss"
                className="grid size-6 shrink-0 place-items-center rounded-md text-ink-tertiary transition-colors hover:bg-surface-sunken hover:text-ink"
              >
                <X className="size-3.5" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}
      </ToastPrimitive.Viewport>
    </ToastPrimitive.Portal>
  );
}

export { ToastProvider, ToastViewport, useToast };
