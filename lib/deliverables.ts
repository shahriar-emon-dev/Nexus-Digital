/**
 * Deliverables put to the client for review, and the annotations left on them.
 *
 * Shaped for the eventual `Deliverable` / `DeliverableVersion` / `Annotation`
 * tables. Pins carry fractional coordinates rather than pixels so a comment
 * stays on the thing it points at whatever size the image is rendered.
 *
 * `boardTasks` in `lib/client-portal.ts` links here by `taskId`, so the Review
 * column on a project board and this screen describe the same piece of work.
 */
import type { TeamMember } from "./team";

export type DeliverableStatus = "In review" | "Changes requested" | "Approved";

export const deliverableStatusTone: Record<
  DeliverableStatus,
  "brand" | "warning" | "success"
> = {
  "In review": "brand",
  "Changes requested": "warning",
  Approved: "success",
};

export type DeliverableVersion = {
  id: string;
  label: string;
  /** ISO. The newest version is the one under review. */
  releasedOn: string;
  image: string;
  alt: string;
  summary: string;
};

export type Annotation = {
  id: string;
  versionId: string;
  /** 0–1 of the image's width and height. */
  x: number;
  y: number;
  /** `TeamMember["id"]`, or "client" for the account holder. */
  authorId: TeamMember["id"] | "client";
  body: string;
  at: string;
  resolved?: boolean;
  replies: number;
};

export type Deliverable = {
  id: string;
  /** `BoardTask["id"]` this was submitted against. */
  taskId: string;
  projectId: string;
  title: string;
  discipline: string;
  status: DeliverableStatus;
  ownerId: TeamMember["id"];
  updatedAt: string;
  versions: DeliverableVersion[];
};

/* TODO: `image` points at a design-tool CDN URL and will expire. */
export const deliverables: Deliverable[] = [
  {
    id: "storefront-hero",
    taskId: "sr-t6",
    projectId: "site-rebuild",
    title: "Storefront Component Library",
    discipline: "UI",
    status: "In review",
    ownerId: "marcus-thorne",
    updatedAt: "2026-07-30T10:00:00Z",
    versions: [
      {
        id: "v1",
        label: "V1",
        releasedOn: "2026-06-18",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAgLTPHzTTPDOJSLkSYZXCnH0E-suwl6cE6uySTCxo2lHpBPlvfh8IXFbggWBdkS3CBZKnjhmDCx0JdUuCo5K8eVXQs3oJ4lnbsDgi8N9rgrBYnfKPZWh_rtldFLQxhpuNwHDzdxsZ6e4LAYwLOm-09xDGZjuLh-nyUmfhLwFCKgt5xmegejJa2t3S3dehFz20yf7l9kOGaPNOfiGQinWpX0_wN4Gy_npeqV2eatCzkpS777KkZUb_cQg",
        alt: "First pass at the storefront hero: stacked layout with a single call to action.",
        summary: "First pass. Stacked layout, single call to action.",
      },
      {
        id: "v2",
        label: "V2",
        releasedOn: "2026-07-09",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAgLTPHzTTPDOJSLkSYZXCnH0E-suwl6cE6uySTCxo2lHpBPlvfh8IXFbggWBdkS3CBZKnjhmDCx0JdUuCo5K8eVXQs3oJ4lnbsDgi8N9rgrBYnfKPZWh_rtldFLQxhpuNwHDzdxsZ6e4LAYwLOm-09xDGZjuLh-nyUmfhLwFCKgt5xmegejJa2t3S3dehFz20yf7l9kOGaPNOfiGQinWpX0_wN4Gy_npeqV2eatCzkpS777KkZUb_cQg",
        alt: "Second pass: asymmetric grid, product cards moved above the fold.",
        summary: "Asymmetric grid. Product cards moved above the fold.",
      },
      {
        id: "v3",
        label: "V3",
        releasedOn: "2026-07-30",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAgLTPHzTTPDOJSLkSYZXCnH0E-suwl6cE6uySTCxo2lHpBPlvfh8IXFbggWBdkS3CBZKnjhmDCx0JdUuCo5K8eVXQs3oJ4lnbsDgi8N9rgrBYnfKPZWh_rtldFLQxhpuNwHDzdxsZ6e4LAYwLOm-09xDGZjuLh-nyUmfhLwFCKgt5xmegejJa2t3S3dehFz20yf7l9kOGaPNOfiGQinWpX0_wN4Gy_npeqV2eatCzkpS777KkZUb_cQg",
        alt: "Current pass: final typography scale and the jade primary call to action.",
        summary: "Final typography scale and the jade primary action.",
      },
    ],
  },
];

export const annotations: Annotation[] = [
  {
    id: "a1",
    versionId: "v3",
    x: 0.24,
    y: 0.18,
    authorId: "client",
    body: "The headline weight feels a little light for the hero. Could we try the bold cut rather than semibold?",
    at: "2026-07-30T08:15:00Z",
    replies: 2,
  },
  {
    id: "a2",
    versionId: "v3",
    x: 0.68,
    y: 0.42,
    authorId: "client",
    body: "Let's increase the glow intensity on the primary action buttons so they read from further away.",
    at: "2026-07-30T08:22:00Z",
    replies: 1,
  },
  {
    id: "a3",
    versionId: "v3",
    x: 0.15,
    y: 0.75,
    authorId: "marcus-thorne",
    body: "Added a hover state to the grid cards — a two-pixel lift with the edge highlight.",
    at: "2026-07-30T09:40:00Z",
    resolved: true,
    replies: 0,
  },
  {
    id: "a4",
    versionId: "v2",
    x: 0.5,
    y: 0.3,
    authorId: "client",
    body: "Product cards are competing with the headline here.",
    at: "2026-07-10T11:05:00Z",
    resolved: true,
    replies: 3,
  },
];

export const deliverableById = (id: string) => deliverables.find((d) => d.id === id);

export const deliverableForTask = (taskId: string) =>
  deliverables.find((d) => d.taskId === taskId);

/** Newest version — what the reviewer lands on. */
export const currentVersion = (deliverable: Deliverable) =>
  deliverable.versions[deliverable.versions.length - 1];

export const annotationsFor = (versionId: string) =>
  annotations
    .filter((a) => a.versionId === versionId)
    .sort((a, b) => a.at.localeCompare(b.at));

/** Open items on the current version — what blocks an approval. */
export const openAnnotations = (versionId: string) =>
  annotationsFor(versionId).filter((a) => !a.resolved);
