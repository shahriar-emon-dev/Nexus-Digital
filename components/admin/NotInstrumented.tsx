import Link from "next/link";
import { ArrowRight, PlugZap, type LucideIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * For screens whose subject genuinely has no data source yet.
 *
 * The alternative — the one this replaces — was a dashboard of plausible
 * figures: 1,248 sessions, threat level LOW, 142 active assets over five rows.
 * Numbers like that get read, believed and acted on. An empty screen that says
 * exactly what is missing and what would fill it is more useful and more
 * honest than a confident fiction.
 *
 * It is deliberately not a "coming soon" message. The route works, the shell
 * is real, and the page states a factual position: nothing is reporting here.
 */
export function NotInstrumented({
  icon: Icon,
  title,
  summary,
  needs,
  related,
}: {
  icon: LucideIcon;
  title: string;
  /** What this screen would show, stated plainly. */
  summary: string;
  /** The specific sources that would have to be connected. */
  needs: { label: string; detail: string }[];
  related?: { label: string; href: string; detail: string }[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <Alert tone="info">
        <AlertTitle>No telemetry is reaching this screen</AlertTitle>
        <AlertDescription>
          Nothing in the stack currently reports {summary.toLowerCase()} This
          page shows no figures rather than estimated ones — a plausible number
          here would be indistinguishable from a real one.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-subtle text-brand-subtle-fg">
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-heading text-lg font-semibold text-ink">{title}</h2>
              <p className="mt-1 text-sm text-ink-tertiary">{summary}</p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold tracking-widest text-ink-tertiary uppercase">
              What would need connecting
            </p>
            <ul className="flex flex-col gap-3">
              {needs.map((n) => (
                <li key={n.label} className="flex items-start gap-3">
                  <PlugZap className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden />
                  <span>
                    <span className="block text-sm font-medium text-ink">{n.label}</span>
                    <span className="block text-sm text-ink-tertiary">{n.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {related && related.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-6">
            <p className="text-xs font-semibold tracking-widest text-ink-tertiary uppercase">
              Measured elsewhere
            </p>
            <ul className="flex flex-col gap-2">
              {related.map((r) => (
                <li key={r.href} className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{r.label}</span>
                    <span className="block text-sm text-ink-tertiary">{r.detail}</span>
                  </span>
                  <Button variant="outline" size="sm" render={<Link href={r.href} />}>
                    Open
                    <ArrowRight />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
