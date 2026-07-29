import Image from "next/image";
import type { Metadata } from "next";
import { AtSign, ExternalLink, Github, Linkedin, MapPin, Phone, Twitter } from "lucide-react";

import { Card } from "@/components/ui/card";
import { NoiseParallax } from "@/components/marketing/NoiseParallax";
import { Reveal } from "@/components/marketing/Reveal";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Ready to transcend digital boundaries? Our team of architects and designers is waiting to bring your most ambitious visions to life.",
};

const channels = [
  {
    icon: AtSign,
    label: "General inquiries",
    value: "hello@cyberagency.com",
    href: "mailto:hello@cyberagency.com",
  },
  {
    icon: Phone,
    label: "Voice comm",
    value: "+1 (555) 012-3456",
    href: "tel:+15550123456",
  },
];

const socials = [
  { icon: Twitter, label: "Nexus on X" },
  { icon: Linkedin, label: "Nexus on LinkedIn" },
  { icon: Github, label: "Nexus on GitHub" },
];

export default function ContactPage() {
  return (
    <>
      <NoiseParallax />

      <div className="pb-32">
        <Reveal>
          <section className="mx-auto mb-24 max-w-7xl px-4 pt-10 md:px-10">
            <h1 className="mb-6 bg-gradient-to-r from-ink via-brand to-ion bg-clip-text font-heading text-display leading-tight font-bold text-balance text-transparent">
              Let&rsquo;s engineer the future together.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-ink-secondary">
              Ready to transcend digital boundaries? Our team of architects and designers is
              waiting to bring your most ambitious visions to life.
            </p>
          </section>
        </Reveal>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 md:px-10 lg:grid-cols-12">
          <Reveal delay={100} className="lg:col-span-7">
            <Card variant="glass" className="h-full p-8">
              <h2 className="mb-8 font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
                Send a message
              </h2>
              <ContactForm />
            </Card>
          </Reveal>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <Reveal delay={200}>
              <Card variant="glass" className="p-8">
                <h2 className="mb-6 font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
                  Direct channels
                </h2>

                <ul className="flex flex-col gap-6">
                  {channels.map(({ icon: Icon, label, value, href }) => (
                    <li key={label} className="flex items-start gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-chart-3/20">
                        <Icon className="size-5 text-chart-3" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.8125rem] font-medium text-ink-tertiary">
                          {label}
                        </span>
                        <a
                          href={href}
                          className="text-lg break-words text-ink transition-colors hover:text-chart-3 focus-visible:text-chart-3"
                        >
                          {value}
                        </a>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 border-t border-line-subtle pt-8">
                  <p className="mb-4 text-[0.8125rem] font-medium text-ink-tertiary">
                    Follow neural feeds
                  </p>
                  <div className="flex gap-4">
                    {socials.map(({ icon: Icon, label }) => (
                      <a
                        key={label}
                        href="#"
                        aria-label={label}
                        className="grid size-10 place-items-center rounded-full border border-line text-ink-secondary transition-colors hover:bg-surface-sunken hover:text-ink"
                      >
                        <Icon className="size-5" aria-hidden />
                      </a>
                    ))}
                  </div>
                </div>
              </Card>
            </Reveal>

            <Reveal delay={300}>
              <Card variant="glass" className="overflow-hidden">
                <div className="p-8">
                  <h2 className="mb-2 font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
                    The Nexus Hub
                  </h2>
                  <p className="text-ink-tertiary">
                    42 Silicon Plaza, Neural District, SF 94103
                  </p>
                </div>

                <div className="group relative h-64 overflow-hidden bg-surface-sunken">
                  {/* The map art is filtered; the pin is not — it has to stay
                      brand-coloured to read as a marker. The source put both
                      inside the filtered element and inverted the pin too. */}
                  {/* TODO: swap for a hosted asset or a real map embed. */}
                  <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZACEyyyuZ6TXe83Ni2wxkj6yfRPUhqVnbfCSJDJez5f_whd_6L7bSB0i1swsgtCtASX-xbMKRqBf9dI_pNVxND0xSip0fqMjge8vICLpJ3KA15kHtjbvlvIqGaTz_u5AyxXBXrQttfASLW_blaW0CnO2IrhvH_RYcCc5EP5GA8gxnpxNVO8S53tWwbotLrFXfnokbslhy4-YuVLM6oxKpYaoDEKg2bR2BUIT6Zqy8TWAHGETpK2RHbuh8nXX7jOwNm_7f5BPBuKJd"
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 420px, 100vw"
                    className="object-cover opacity-60 brightness-75 grayscale"
                  />
                  <div
                    className="absolute inset-0 z-10 bg-gradient-to-t from-surface to-transparent opacity-40"
                    aria-hidden
                  />

                  <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
                    <span className="relative grid place-items-center">
                      <span
                        className="absolute -inset-4 animate-ping rounded-full bg-brand/20 motion-reduce:animate-none"
                        aria-hidden
                      />
                      <MapPin
                        className="relative size-9 fill-brand text-brand"
                        aria-label="Office location"
                      />
                    </span>
                  </div>

                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-4 bottom-4 z-20 inline-flex items-center gap-2 rounded-lg border border-line bg-surface/90 px-4 py-2 text-[0.8125rem] font-medium text-ink backdrop-blur-md transition-colors hover:border-brand"
                  >
                    Open protocol
                    <ExternalLink className="size-3.5" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </div>
              </Card>
            </Reveal>
          </div>
        </section>
      </div>
    </>
  );
}
