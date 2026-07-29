"use client";

import { KanbanBoard, type KanbanState } from "@/components/shared/KanbanBoard";
import type { KanbanColumnData } from "@/components/shared/KanbanColumn";

const columns: KanbanColumnData[] = [
  { id: "backlog", title: "Backlog", accent: "neutral" },
  { id: "progress", title: "In progress", accent: "info", wipLimit: 3 },
  { id: "review", title: "In review", accent: "warning" },
  { id: "done", title: "Shipped", accent: "brand" },
];

const initialCards: KanbanState = {
  backlog: [
    {
      id: "k1",
      title: "Migrate product images to the CDN",
      description: "3.2k assets. Needs a redirect map so we don't drop the SEO equity.",
      priority: "medium",
      labels: ["Perf"],
      assignees: [{ name: "Sam Ellery" }],
      comments: 2,
    },
    {
      id: "k2",
      title: "Wishlist persistence across devices",
      priority: "low",
      labels: ["Feature"],
      assignees: [{ name: "Mira Kaur" }],
    },
  ],
  progress: [
    {
      id: "k3",
      title: "Checkout rebuild — payment step",
      description: "Stripe Elements in, legacy iframe out. Blocked on the PCI sign-off.",
      priority: "urgent",
      labels: ["Commerce", "Blocked"],
      assignees: [{ name: "Dez Okafor" }, { name: "Sam Ellery" }],
      dueDate: "29 Jul",
      overdue: true,
      comments: 8,
      attachments: 3,
      checklist: { done: 5, total: 9 },
    },
    {
      id: "k4",
      title: "GA4 server-side tagging",
      description: "Move to a first-party endpoint so Safari stops eating the conversions.",
      priority: "high",
      labels: ["Analytics"],
      assignees: [{ name: "Mira Kaur" }],
      dueDate: "02 Aug",
      checklist: { done: 3, total: 6 },
    },
  ],
  review: [
    {
      id: "k5",
      title: "Category taxonomy v2",
      description: "412 URLs re-slugged. Redirects staged and waiting on client approval.",
      priority: "high",
      labels: ["SEO"],
      assignees: [{ name: "Dez Okafor" }],
      dueDate: "30 Jul",
      comments: 4,
    },
  ],
  done: [
    {
      id: "k6",
      title: "Design system rollout",
      priority: "medium",
      labels: ["Design"],
      assignees: [{ name: "Priya Raman" }],
      checklist: { done: 12, total: 12 },
    },
    {
      id: "k7",
      title: "Performance budget in CI",
      priority: "low",
      labels: ["Perf", "DX"],
      assignees: [{ name: "Sam Ellery" }],
    },
  ],
};

export function BoardClient() {
  return <KanbanBoard columns={columns} initialCards={initialCards} />;
}
