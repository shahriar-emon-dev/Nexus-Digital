/**
 * Client quotes shown on the auth panels.
 *
 * Names and companies are kept consistent with the rest of the site — Marcus
 * Sterling is Astra Banking's CEO in the case study, Priya Raman is Northwind's
 * VP Growth in the client portal, Nova Fintech appears in the admin logs. The
 * source design attributed one of these quotes to Sarah Chen as "CTO of
 * DataFlow", but she is Nexus's own VP of Engineering in `lib/team.ts`, so that
 * one is reattributed rather than contradicting the team page.
 */
export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  role: string;
};

export const authTestimonials: Testimonial[] = [
  {
    id: "astra",
    quote: "Nexus cleared our technical debt in record time.",
    name: "Marcus Sterling",
    role: "CEO, Astra Banking",
  },
  {
    id: "northwind",
    quote: "The authentication suite is bulletproof and seamless.",
    name: "Priya Raman",
    role: "VP Growth, Northwind Retail",
  },
  {
    id: "nova",
    quote: "Scaling was a breeze with Nexus's architecture.",
    name: "Jameson Kael",
    role: "Lead Architect, Nova Fintech",
  },
];
