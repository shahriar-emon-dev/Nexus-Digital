"use client";

import * as React from "react";
import { Lock, LockOpen, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Maintenance-mode switch.
 *
 * Two departures from the source. It confirms before engaging: this signs every
 * user out of the platform, and a single unguarded click is the wrong amount of
 * friction for that. And it does not desaturate the page — the original added
 * `grayscale` to `<body>`, which strips the colour off every status badge,
 * chart series and alert in the app at exactly the moment an operator most
 * needs to read them. A banner states the mode instead.
 */
export function EmergencyLock() {
  const [locked, setLocked] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              variant={locked ? "default" : "destructive"}
              size="sm"
              className={cn(
                "rounded-xl tracking-widest uppercase",
                locked && "bg-danger text-canvas hover:bg-danger"
              )}
            >
              {locked ? <Lock /> : <LockOpen />}
              <span className="hidden sm:inline">
                {locked ? "System Locked" : "Emergency Lock"}
              </span>
            </Button>
          }
        />
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              {locked ? "Lift maintenance mode?" : "Engage maintenance mode?"}
            </DialogTitle>
            <DialogDescription>
              {locked
                ? "Clients and staff will regain access immediately. In-flight sessions are not restored."
                : "This signs every client and staff member out and blocks new sign-ins until you lift it. Admins keep access."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Cancel</Button>} />
            <Button
              variant={locked ? "default" : "destructive"}
              onClick={() => {
                setLocked((l) => !l);
                setOpen(false);
              }}
            >
              {locked ? "Lift lock" : "Lock the platform"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {locked && (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-100 flex items-center justify-center gap-2 bg-danger px-4 py-1.5 text-xs font-semibold text-canvas"
        >
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
          Maintenance mode is active — clients and staff cannot sign in.
        </div>
      )}
    </>
  );
}
