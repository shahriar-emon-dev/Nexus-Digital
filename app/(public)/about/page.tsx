import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Terminal, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import { departmentTone, leadership } from "@/lib/team";
import { listPublicStaff } from "@/lib/supabase/staff-queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AgencyPulse } from "@/components/about/AgencyPulse";
import { Timeline } from "@/components/about/Timeline";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "We moved beyond the bloated legacy agency model. Nexus is built for high-velocity execution, leveraging specialized engineering pods to deploy complex digital ecosystems with surgical precision.",
};

const ethos = [
  { icon: Terminal, label: "0% Bloat Architecture" },
  { icon: Zap, label: "Hyper-Agile Cycles" },
];

// The roster is database-backed, so a fully static page would serve whatever
// existed at build time. ISR keeps the page static and cheap while letting a
// newly published staff member appear without a deploy.
export const revalidate = 60;

export default async function AboutPage() {
  // Published staff win. Falling back to the built-in roster means the page is
  // never empty before anyone has been published, and an administrator takes
  // it over simply by marking staff public — no deploy, no blank section.
  const published = await listPublicStaff();
  const roster = published.length > 0 ? published : leadership;

  return (
    <>
      <div className="noise-field" aria-hidden />

      {/* ── Philosophy hero ────────────────────────────────────────────── */}
      <section className="relative flex min-h-[min(51rem,80svh)] items-center justify-center overflow-hidden px-4 py-20 md:px-10">
        <div className="absolute inset-0" aria-hidden>
          <div className="cyber-grid absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-b from-canvas/0 via-canvas/60 to-canvas" />
        </div>

        <Reveal className="relative z-10 max-w-4xl text-center">
          <p className="mb-6 inline-block rounded-full border border-brand/20 bg-brand/10 px-4 py-1.5 text-[0.8125rem] font-semibold tracking-wider text-brand uppercase">
            Engineering-first ethos
          </p>
          <h1 className="mb-8 font-heading text-display leading-none font-bold text-balance text-ink">
            Engineering the Future of{" "}
            <span className="text-brand italic">Digital Command.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-ink-secondary">
            We moved beyond the bloated legacy agency model. Nexus is built for high-velocity
            execution, leveraging specialized engineering pods to deploy complex digital
            ecosystems with surgical precision.
          </p>
          <ul className="flex flex-wrap justify-center gap-6">
            {ethos.map((item) => (
              <li
                key={item.label}
                className="border-beam glass flex items-center gap-3 rounded-xl px-6 py-4"
              >
                <item.icon className="size-5 text-brand" aria-hidden />
                <span className="text-[0.8125rem] font-semibold">{item.label}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <AgencyPulse />

      {/* ── Timeline ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl overflow-hidden px-4 py-32 md:px-10">
        <Reveal className="mb-24 text-center">
          <h2 className="mb-4 font-heading text-[2rem] font-bold text-ink md:text-[3rem]">
            Evolutionary Roadmap
          </h2>
          <span className="mx-auto block h-1 w-24 rounded-full bg-brand" aria-hidden />
        </Reveal>

        <Timeline />
      </section>

      {/* ── Leadership ─────────────────────────────────────────────────── */}
      <section className="bg-surface-sunken px-4 py-32 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex flex-col items-end justify-between gap-6 md:flex-row">
            <div className="max-w-2xl">
              <h2 className="mb-4 font-heading text-[2rem] font-bold text-ink md:text-[3rem]">
                The Command Unit
              </h2>
              <p className="text-lg leading-relaxed text-ink-tertiary">
                Our leadership is composed of engineers who still commit code. We believe the
                best technical strategies come from practitioners.
              </p>
            </div>
            <Link
              href="/admin/staff"
              className="group flex items-center gap-2 text-[0.8125rem] font-semibold tracking-wider text-brand uppercase transition-[gap] duration-(--duration-normal) hover:gap-4"
            >
              View full directory
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {roster.map((member, i) => (
              <li key={member.id}>
                <Reveal delay={i * 90}>
                  <Card
                    variant="glass"
                    interactive
                    className="group h-full overflow-hidden rounded-2xl"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={member.portrait}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover grayscale transition-[filter,transform] duration-700 ease-(--ease-out-quint) group-hover:scale-105 group-hover:grayscale-0"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-graphite-1000/70 via-transparent to-transparent"
                        aria-hidden
                      />
                    </div>

                    <div className="p-6">
                      <p
                        className={cn(
                          "mb-3 inline-block rounded px-2 py-0.5 text-[0.625rem] font-bold tracking-widest uppercase",
                          departmentTone[member.department]
                        )}
                      >
                        {member.department}
                      </p>
                      <h3 className="font-heading text-2xl font-semibold text-ink">
                        {member.name}
                      </h3>
                      <p className="mb-6 text-[0.8125rem] font-medium text-ink-tertiary">
                        {member.role}
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {member.skills.map((skill) => (
                          <li
                            key={skill}
                            className="rounded border border-line bg-surface-sunken px-2 py-1 text-[0.6875rem] text-ink-secondary"
                          >
                            {skill}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 py-32 text-center md:px-10">
        <span
          className="pointer-events-none absolute top-0 left-1/2 h-100 w-200 -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]"
          aria-hidden
        />
        <Reveal className="relative z-10 mx-auto max-w-3xl">
          <h2 className="mb-8 font-heading text-[3rem] leading-[1.2] font-bold text-ink">
            Ready to deploy?
          </h2>
          <p className="mb-12 text-lg leading-relaxed text-ink-secondary">
            Experience the difference of an engineering-first partnership. No fluff, just
            high-performance digital solutions.
          </p>
          <div className="flex flex-col justify-center gap-6 sm:flex-row">
            <Button size="xl" className="rounded-xl px-10" render={<Link href="/contact" />}>
              Start a Project
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="rounded-xl px-10"
              render={<Link href="/services" />}
            >
              Our Methodology
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
