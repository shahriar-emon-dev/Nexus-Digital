"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, Loader2, Trash2, Upload } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage, initials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useRealtime } from "@/lib/supabase/use-realtime";
import {
  removeMyAvatar,
  updateMyAvatar,
  updateMyProfile,
  type ProfileWithOrg,
} from "@/lib/supabase/profile-actions";
import { cn } from "@/lib/utils";

/** A short, hand-picked list beats 400 IANA zones in a dropdown nobody scrolls. */
const TIMEZONES = [
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Lisbon",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export function ProfileForm({ profile }: { profile: ProfileWithOrg }) {
  const router = useRouter();
  const toast = useToast();

  const [current, setCurrent] = React.useState(profile);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [timezone, setTimezone] = React.useState(profile.timezone);
  const fileRef = React.useRef<HTMLInputElement>(null);

  /**
   * Realtime: an admin reassigning this person's portal or role, or a change
   * made in another tab, lands here without a reload. Only this row is
   * subscribed, and only this component's state is replaced.
   */
  useRealtime(
    `profile:${profile.id}`,
    [{ table: "profiles", event: "UPDATE", filter: `id=eq.${profile.id}` }],
    (payload) => {
      setCurrent((prev) => ({ ...prev, ...(payload.new as ProfileWithOrg) }));
      router.refresh(); // keeps the sidebar, which renders server-side, in step
    }
  );

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const data = new FormData(e.currentTarget);
    data.set("timezone", timezone);
    const result = await updateMyProfile(data);

    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Profile saved", type: "success" });
    router.refresh();
  }

  async function onAvatarPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const data = new FormData();
    data.set("avatar", file);
    const result = await updateMyAvatar(data);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";

    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Avatar updated", type: "success" });
    router.refresh();
  }

  async function onAvatarRemoved() {
    setUploading(true);
    const result = await removeMyAvatar();
    setUploading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.add({ title: "Avatar removed", type: "info" });
    router.refresh();
  }

  const name = current.full_name || current.email;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ------------------------------------------------------- identity -- */}
      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-5">
          <Avatar className="size-20">
            {current.avatar_url && <AvatarImage src={current.avatar_url} alt="" />}
            <AvatarFallback className="text-lg">{initials(name)}</AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Upload />}
                {uploading ? "Uploading…" : "Upload a photo"}
              </Button>
              {current.avatar_url && (
                <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={onAvatarRemoved}>
                  <Trash2 />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-ink-tertiary">PNG, JPEG, WebP or GIF. 2 MB maximum.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              aria-label="Choose a profile photo"
              onChange={onAvatarPicked}
            />
          </div>
        </CardContent>
      </Card>

      {/* --------------------------------------------------------- details -- */}
      <form onSubmit={onSave}>
        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" defaultValue={current.full_name} maxLength={120} required />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                {/* Changing an email re-verifies the identity, so it is not a
                    field on this form. */}
                <Input id="email" value={current.email} readOnly disabled />
                <p className="text-xs text-ink-tertiary">
                  Contact an administrator to change your sign-in address.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="jobTitle">Job title</Label>
                <Input id="jobTitle" name="jobTitle" defaultValue={current.job_title ?? ""} maxLength={120} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" defaultValue={current.phone ?? ""} maxLength={40} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="timezone">Time zone</Label>
                <Select value={timezone} onValueChange={(v) => setTimezone(v as string)}>
                  <SelectTrigger id="timezone" aria-label="Time zone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" name="bio" rows={4} maxLength={600} defaultValue={current.bio ?? ""} />
              <p className="text-xs text-ink-tertiary">600 characters maximum.</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Check />}
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      {/* ---------------------------------------------------- account info -- */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Read-only on purpose: portal, role and organisation are assigned by
              an administrator and rejected by a database trigger otherwise. */}
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium tracking-wide text-ink-tertiary uppercase">Portal</dt>
              <dd className="mt-1.5">
                <Badge variant="brand">{current.portal}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-ink-tertiary uppercase">Role</dt>
              <dd className="mt-1.5 text-sm text-ink">
                {current.roles?.name ?? <span className="text-ink-tertiary">Not assigned</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium tracking-wide text-ink-tertiary uppercase">Organisation</dt>
              <dd className={cn("mt-1.5 flex items-center gap-1.5 text-sm text-ink")}>
                {current.organizations ? (
                  <>
                    <Building2 className="size-3.5 text-ink-tertiary" aria-hidden />
                    {current.organizations.name}
                  </>
                ) : (
                  <span className="text-ink-tertiary">None</span>
                )}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-ink-tertiary">
            These are assigned by an administrator and update here automatically
            when they change.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
