/**
 * Policy documents.
 *
 * Shaped for a `LegalDocument` table so these can be edited from the CMS later
 * without a deploy. `updatedAt` is rendered, because a policy without a date is
 * not much of a policy.
 *
 * This is honest placeholder wording describing what the platform actually
 * does. It is not legal advice and has not been reviewed by a lawyer — see the
 * notice each page renders.
 */

export type LegalSection = { heading: string; body: string[] };

export type LegalDocument = {
  slug: "privacy" | "terms";
  title: string;
  summary: string;
  updatedAt: string;
  sections: LegalSection[];
};

const CONTACT = "legal@nexus.agency";

export const legalDocuments: LegalDocument[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary:
      "What we collect when you use the Nexus platform, why we hold it, and how to have it removed.",
    updatedAt: "2026-07-31",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Account details you give us directly: name, work email, organisation and role. We use these to identify you across the client, staff and admin portals.",
          "Operational records created as you work: projects, milestones, messages, deliverable annotations, invoices and meeting notes. These exist because the product needs them to function.",
          "Technical data your browser sends: IP address, user agent, and the pages you request. We use this for security and for diagnosing faults.",
        ],
      },
      {
        heading: "What we do not collect",
        body: [
          "We do not sell personal data, and we do not share it with advertisers.",
          "We do not store payment card numbers. Card details are handled by our payment processor and never reach our servers.",
          "API credentials you add under Settings are stored hashed. After you save one, only its final four characters are ever shown again.",
        ],
      },
      {
        heading: "Analytics and tracking",
        body: [
          "If a Google Analytics or Tag Manager identifier is configured for this workspace, those services receive page-view data subject to their own policies.",
          "Any custom scripts added under Settings run on every public page. An administrator of your workspace controls what those scripts are.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Operational records are retained for the life of the engagement and for seven years afterwards, where financial regulation requires it.",
          "Technical logs are retained for 90 days.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          `You can request a copy of your data, ask us to correct it, or ask us to delete it. Write to ${CONTACT} and we will respond within 30 days.`,
          "Deletion requests are honoured except where we are legally required to retain a record, such as issued invoices.",
        ],
      },
      {
        heading: "Contact",
        body: [
          `Questions about this policy go to ${CONTACT}. If you are not satisfied with our response you may complain to your local data protection authority.`,
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    summary:
      "The agreement between you and Nexus Digital Agency covering use of this platform.",
    updatedAt: "2026-07-31",
    sections: [
      {
        heading: "Using the platform",
        body: [
          "Access is granted to named individuals at organisations we have an engagement with. Accounts are personal — do not share credentials.",
          "You are responsible for activity under your account. Tell us immediately at " +
            CONTACT +
            " if you believe it has been compromised.",
          "Two-factor authentication is required for accounts with administrative access.",
        ],
      },
      {
        heading: "Your content",
        body: [
          "You keep ownership of everything you upload: briefs, assets, feedback and messages.",
          "You grant us the licence needed to host, process and display that content in order to deliver the service.",
          "We may remove content that is unlawful, or that puts the platform or other users at risk.",
        ],
      },
      {
        heading: "Our deliverables",
        body: [
          "Ownership of work we produce transfers to you on full payment of the invoice covering it, unless your engagement contract says otherwise.",
          "Approving a deliverable in the portal is a record of acceptance. It does not replace the terms of your engagement contract, which takes precedence if the two conflict.",
        ],
      },
      {
        heading: "Billing",
        body: [
          "Invoices are payable within the terms shown on the invoice itself. Standard terms are 30 days.",
          "Overdue balances may accrue interest at the rate stated on the invoice.",
          "Recurring retainers renew automatically until either party gives notice under the engagement contract.",
        ],
      },
      {
        heading: "Availability",
        body: [
          "We aim for high availability but do not guarantee uninterrupted service. Planned maintenance is announced in advance in the portal.",
          "We are not liable for indirect or consequential loss arising from unavailability.",
        ],
      },
      {
        heading: "Ending access",
        body: [
          "Either party may end the engagement under the terms of the engagement contract.",
          "On termination we will provide an export of your data on request for 30 days, after which it is deleted under the retention terms in the Privacy Policy.",
        ],
      },
      {
        heading: "Changes",
        body: [
          "We may update these terms. Material changes are notified in the portal at least 30 days before they take effect.",
        ],
      },
    ],
  },
];

export const legalBySlug = (slug: string) =>
  legalDocuments.find((d) => d.slug === slug);
