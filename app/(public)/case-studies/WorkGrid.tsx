"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type Layout = "featured" | "tall" | "wide" | "half";

type Project = {
  id: string;
  title: string;
  blurb: string;
  category: string;
  layout: Layout;
  image: string;
  href: string;
  eyebrow?: string;
  featured?: boolean;
  metrics?: { value: string; label: string; tone: "brand" | "ion" }[];
  tags?: string[];
};

/* TODO: every `image` below is a design-tool CDN URL and will expire — swap for
   hosted assets. */
const projects: Project[] = [
  {
    id: "omnipay",
    title: "OmniPay Global",
    blurb:
      "Reinventing cross-border liquidity for the next generation of digital-first enterprise banking systems.",
    category: "Fintech",
    layout: "featured",
    featured: true,
    href: "/case-studies/omnipay-global",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDMiJyYR5UdZHCwgyb0_ciemaLR75aVVQGM68krJXvG_m6xVD4XUArn8WBnRmwijymy2DI2L6X2J8mMlRPcJg9yM85kzl-LyVRp9vLtSAWfE63ala7wKU9MNXeI6CBhktyCfgF5vLiX75ctRzmPItLNhY7Qu2mdlrl8dw0t_tmIoxCktP8RQ0V8FHQM8rVmP_ZSelSfpi-SPMUdxfuEIauWaZ6VJgZL_14HomyqpFIZXAoeiYZafWNdp0SBQf_I7dv2RWT6A6TpO_no",
    metrics: [
      { value: "+240%", label: "Efficiency", tone: "brand" },
      { value: "12ms", label: "Latency", tone: "ion" },
    ],
  },
  {
    id: "aether",
    title: "Aether Dynamics",
    blurb: "Architecting the neural interface for autonomous logistics swarms.",
    category: "AI & Robotics",
    eyebrow: "Robotics",
    layout: "tall",
    href: "/case-studies/aether-dynamics",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDEESPyaJFjn_UtZ5bh_FhnV5TQEeFrtspo1AQU3GhziDgdWC8rLLItYGgn8NqKajMAx1C9Wd618FH_5URH3oVMN6Aav5J6l2t8SlOU-aF8PdtOE3scqWuMvYWgCBoNU-8ao-av-1eS_3IifPWcRFFH0Kts1E3z7YrOUzr9nlWQ9McL4i6ZoNtEmYRSJQB4OHikMl9ieGyjHyPoKq_5tYNumeh7NChh9nmZHzFmJfBpUuI9Gy4VG_GEdXP8u63wTGnq4Y6ft33KRYAR",
  },
  {
    id: "nexus-os",
    title: "Nexus OS v4.0",
    blurb:
      "The world's first spatial operating system for decentralized city management and resource allocation.",
    category: "Web3",
    layout: "wide",
    href: "/case-studies/nexus-os",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCbTEtAirjHiRG8kiUGhARje9c4poKPVayjdY_1pg5u_lK40bU1p5E4XPlwkalfdq7NHvhB4dLnk7op3BmbM-5AgQF9GIN9JMkhSmbP-mGTic29zAe09V-DJXrBgReF581HPYqlV7k7BaD4mves648BmvKxNwey87fn24s7kLg4_WiseaYCl7k8hlIU3iTvNRkap6KnVLvATuXkK1kB7W-Y8GDlVCexswk9tMOYuRCSCauQwT4bGU5KkgyF0YfjPU68C0dZTjfiaEqJ",
    tags: ["Real-time Visualization", "Blockchain-Verified"],
  },
  {
    id: "vogue",
    title: "Vogue Digital",
    blurb: "High-Fashion E-commerce Evolution.",
    category: "E-Commerce",
    layout: "half",
    href: "/case-studies/vogue-digital",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC5QlEL_99BEaevBDbAY00gy5s7tCb7R2yNNhjk90k4nz-61UtrAIR4TlpMcD6--cPnkSdQjgq-3c2l9M-3W1dRlWzZ-U8vnPeAAvt6Hpg4mYo67IjElXbmRQcGOvoN8d68DhwJo2HENXI290P-3Q26d5R0ZnSsJUwHKm9MB2HOMJSlGn0he3YFUEa7GjCJQ6j4xVlJQGjK_bOoJusGt19a3mpEF3EucrKVdvBdRStzJjIazmVi-ufpjM8Qo9RxgzlKuMjg2ojIa5xa",
  },
  {
    id: "kryptos",
    title: "Kryptos Protocol",
    blurb: "Web3 Infrastructure for Enterprise Security.",
    category: "Web3",
    layout: "half",
    href: "/case-studies/kryptos-protocol",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBTer96E25Uy9FnYTi-kiBoN9vAeZdw-wX1jyoKvlYwH2UVj0iMGrx4Z_ORX22gpeemBbBUAYrCOqd5Z9eWvNbvuLY-OkMJ1toXnYptaJhPgK-ZxWBo7EN-PW0gRGM6K-W2s0o2coFCF_wtFkzSA9xKSG1kb2F92o4aHLNWQUrhRKnpFVFphQC2t1uNjgzhbPk7KyOTp6neBdxYhBeJVpRGAYWdBS5pNJ2DY-FO2SxRCHWpwmKMPQcTrO926iuz1ojlpGjXMCGzS9tb",
  },
];

const filters = ["All Work", "Fintech", "AI & Robotics", "E-Commerce", "Web3"] as const;

const spans: Record<Layout, string> = {
  featured: "md:col-span-8 h-150",
  tall: "md:col-span-4 h-150",
  wide: "md:col-span-12 h-100",
  half: "md:col-span-6 h-125",
};

const glassPanel =
  "glass rounded-full px-3 py-1 text-[0.625rem] font-bold tracking-[0.15em] uppercase";

export function WorkGrid() {
  const [active, setActive] = React.useState<string>("All Work");

  const shown = React.useMemo(
    () => (active === "All Work" ? projects : projects.filter((p) => p.category === active)),
    [active]
  );

  return (
    <>
      {/* Filters. The source rendered these as inert buttons; wired up here so
          they do what they look like they do. */}
      <div className="mx-auto mb-16 max-w-7xl px-4 md:px-10">
        <div
          role="group"
          aria-label="Filter work by discipline"
          className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-4"
        >
          {filters.map((filter) => {
            const selected = active === filter;
            return (
              <button
                key={filter}
                type="button"
                aria-pressed={selected}
                onClick={() => setActive(filter)}
                className={cn(
                  "glass rounded-full px-6 py-2 text-[0.8125rem] font-semibold tracking-[0.05em] whitespace-nowrap",
                  "transition-colors duration-(--duration-fast)",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  selected
                    ? "border-brand text-brand"
                    : "text-ink-tertiary hover:text-brand"
                )}
              >
                {filter}
              </button>
            );
          })}
        </div>
        <p aria-live="polite" className="sr-only">
          Showing {shown.length} {shown.length === 1 ? "project" : "projects"} in {active}.
        </p>
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-32 md:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {shown.map((project) => (
            <article
              key={project.id}
              data-glow-hot
              className={cn(
                "glass group relative overflow-hidden rounded-2xl",
                spans[project.layout],
                project.featured && "border-beam"
              )}
            >
              <Image
                src={project.image}
                alt=""
                fill
                sizes="(min-width: 768px) 66vw, 100vw"
                className="object-cover transition-transform duration-700 ease-(--ease-out-quint) group-hover:scale-110"
              />

              {project.layout === "wide" ? (
                <>
                  <div
                    className="absolute inset-0 z-10 bg-graphite-1000/65 transition-colors duration-(--duration-slow) group-hover:bg-graphite-1000/45"
                    aria-hidden
                  />
                  <div className="absolute inset-0 z-20 flex items-center justify-center px-8">
                    <div className="max-w-2xl text-center">
                      <h3 className="mb-4 font-heading text-[3rem] leading-[1.2] font-bold text-balance text-graphite-25">
                        <Link href={project.href} className="after:absolute after:inset-0">
                          {project.title}
                        </Link>
                      </h3>
                      <p className="mb-8 leading-relaxed text-graphite-300">{project.blurb}</p>
                      <div className="flex flex-wrap justify-center gap-4">
                        {project.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="glass rounded-full px-4 py-2 text-sm text-graphite-100"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={cn(
                      "absolute inset-0 z-10",
                      project.layout === "tall"
                        ? "bg-gradient-to-b from-graphite-1000/40 via-transparent to-graphite-1000"
                        : "bg-gradient-to-t from-graphite-1000 via-graphite-1000/20 to-transparent"
                    )}
                    aria-hidden
                  />

                  {project.featured && (
                    <div className="absolute top-8 left-8 z-20 flex gap-3">
                      <span className={cn(glassPanel, "text-brand")}>Featured project</span>
                      <span className={cn(glassPanel, "text-ion")}>{project.category}</span>
                    </div>
                  )}

                  <div
                    className={cn(
                      "absolute z-20",
                      project.layout === "featured"
                        ? "right-10 bottom-10 left-10"
                        : "right-8 bottom-8 left-8"
                    )}
                  >
                    {project.eyebrow && (
                      <span className="mb-2 block text-[0.625rem] font-bold tracking-[0.15em] text-ion uppercase">
                        {project.eyebrow}
                      </span>
                    )}

                    <div
                      className={cn(
                        project.layout === "featured" &&
                          "flex flex-col items-end justify-between gap-6 md:flex-row"
                      )}
                    >
                      <div>
                        <h3 className="mb-2 font-heading text-[2rem] leading-[1.3] font-semibold text-graphite-25">
                          <Link href={project.href} className="after:absolute after:inset-0">
                            {project.title}
                          </Link>
                        </h3>
                        <p
                          className={cn(
                            "leading-relaxed text-graphite-300",
                            project.layout === "featured" && "max-w-md"
                          )}
                        >
                          {project.blurb}
                        </p>
                      </div>

                      {project.metrics && (
                        <dl className="flex shrink-0 gap-12">
                          {project.metrics.map((metric) => (
                            <div key={metric.label} className="text-center">
                              <dt className="sr-only">{metric.label}</dt>
                              <dd
                                data-tabular
                                className={cn(
                                  "font-heading text-2xl font-bold",
                                  metric.tone === "brand" ? "text-brand" : "text-ion"
                                )}
                              >
                                {metric.value}
                              </dd>
                              <p
                                className="text-[0.625rem] tracking-wide text-graphite-300 uppercase"
                                aria-hidden
                              >
                                {metric.label}
                              </p>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>

                    {project.layout === "tall" && (
                      <span className="mt-6 inline-flex items-center gap-2 text-[0.8125rem] font-semibold tracking-[0.05em] text-brand">
                        View case study
                        <ArrowRight
                          className="size-4 transition-transform duration-(--duration-normal) group-hover:translate-x-1"
                          aria-hidden
                        />
                      </span>
                    )}
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
