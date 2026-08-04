"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMenu, type MenuLocation } from "@/lib/supabase/nav-actions";

export function CreateMenuButton() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [location, setLocation] = React.useState<string>("none");
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = await createMenu(
      name,
      location === "none" ? null : (location as MenuLocation)
    );
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setName("");
    setLocation("none");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        New menu
      </Button>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create a menu</DialogTitle>
            <DialogDescription>
              A menu only appears on the public site once it is assigned a location.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="menu-new-name">Name</Label>
              <Input
                id="menu-new-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Main Navigation"
                autoFocus
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="menu-new-location">Location</Label>
              <Select value={location} onValueChange={(v) => setLocation(v as string)}>
                <SelectTrigger id="menu-new-location" aria-label="Location">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="utility">Utility bar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={!name.trim()}>
              <Plus />
              Create menu
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
