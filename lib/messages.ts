/**
 * Conversations behind the client portal's communication hub.
 *
 * Shaped for the eventual `Channel` / `Message` / `MessageBlock` tables. Authors
 * are `lib/team.ts` ids, or the literal `"client"` for the account holder, so
 * nobody's name or job title is typed twice — the design captioned Sarah Chen
 * as "Nexus Team Lead" while the team directory has her as VP of Engineering.
 *
 * `lib/client-portal.ts` derives its overview preview list from here, so the
 * "Recent Communications" card and this surface can never quote different
 * messages. This module must not import from there, or the two would cycle.
 */
import { leadership, type TeamMember } from "./team";

/** The account holder. Staff are team ids; this is the client side of a thread. */
export const CLIENT_AUTHOR = "client" as const;

export type MessageAuthor = TeamMember["id"] | typeof CLIENT_AUTHOR;

export type Channel = {
  id: string;
  /** Rendered with a leading `#`; stored without, the way a slug would be. */
  name: string;
  /** `PortalProject["id"]` when the channel belongs to a project. Loose to
   *  avoid a circular import — client-portal imports this module. */
  projectId?: string;
  purpose: string;
  unread: number;
  participantIds: TeamMember["id"][];
  extraParticipants: number;
  /** Who is reachable right now. Drives the presence dots in the header. */
  onlineIds: TeamMember["id"][];
};

export const channels: Channel[] = [
  {
    id: "site-rebuild-build",
    name: "site-rebuild-build",
    projectId: "site-rebuild",
    purpose: "Delivery channel for the headless storefront rebuild.",
    unread: 12,
    participantIds: ["sarah-chen", "alex-vance", "marcus-thorne"],
    extraParticipants: 2,
    onlineIds: ["sarah-chen", "alex-vance"],
  },
  {
    id: "paid-media-q4",
    name: "paid-media-q4",
    projectId: "paid-media",
    purpose: "Bidding model, margin data and channel reporting.",
    unread: 3,
    participantIds: ["elara-kent", "alex-vance"],
    extraParticipants: 0,
    onlineIds: ["elara-kent"],
  },
  {
    id: "brand-guidelines",
    name: "brand-guidelines",
    projectId: "brand-refresh",
    purpose: "Identity system sign-off and asset handover.",
    unread: 0,
    participantIds: ["marcus-thorne", "sarah-chen"],
    extraParticipants: 1,
    onlineIds: [],
  },
  {
    id: "account-general",
    name: "account-general",
    purpose: "Anything that is not tied to a single project.",
    unread: 0,
    participantIds: ["sarah-chen", "elara-kent", "marcus-thorne", "alex-vance"],
    extraParticipants: 0,
    onlineIds: ["sarah-chen"],
  },
];

/**
 * A message is a list of blocks, not an HTML string — that is what lets the
 * renderer stay a component tree with no `dangerouslySetInnerHTML`, and what a
 * `MessageBlock` table would store.
 */
export type MessageBlock =
  | { kind: "text"; text: string }
  | { kind: "code"; language: string; code: string }
  | { kind: "image"; src: string; alt: string }
  | { kind: "file"; name: string; size: string; format: string };

export type ChatMessage = {
  id: string;
  channelId: Channel["id"];
  authorId: MessageAuthor;
  /** ISO 8601. Formatted at render so the timezone is the reader's. */
  sentAt: string;
  blocks: MessageBlock[];
};

/* TODO: `image` blocks point at design-tool CDN URLs and will expire. */
export const chatMessages: ChatMessage[] = [
  // ── site-rebuild-build ──
  {
    id: "m-sr-1",
    channelId: "site-rebuild-build",
    authorId: "alex-vance",
    sentAt: "2026-07-30T10:24:00Z",
    blocks: [
      {
        kind: "text",
        text: "Morning all — I've pushed the initial architecture for the storefront rebuild. It is running on the new design tokens end to end.",
      },
    ],
  },
  {
    id: "m-sr-2",
    channelId: "site-rebuild-build",
    authorId: "sarah-chen",
    sentAt: "2026-07-30T10:31:00Z",
    blocks: [
      {
        kind: "text",
        text: "Here is the theme configuration for the glass surfaces we agreed in the strategy session:",
      },
      {
        kind: "code",
        language: "css",
        code: `@theme {
  --blur-panel: 24px;
  --color-canvas: oklch(0.16 0.008 185);
  --color-surface: oklch(0.20 0.010 185);
}`,
      },
    ],
  },
  {
    id: "m-sr-3",
    channelId: "site-rebuild-build",
    authorId: CLIENT_AUTHOR,
    sentAt: "2026-07-30T11:05:00Z",
    blocks: [
      {
        kind: "text",
        text: "This looks fantastic, Alex. Can we see how the landing page hero will sit with these colours?",
      },
    ],
  },
  {
    id: "m-sr-4",
    channelId: "site-rebuild-build",
    authorId: "alex-vance",
    sentAt: "2026-07-30T11:12:00Z",
    blocks: [
      {
        kind: "text",
        text: "Of course — here is a render of the hero, plus the full technical spec.",
      },
      {
        kind: "image",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCDsFf71KpXFJOvBONsmrUWroxbUM2t-pcFbqiYq1AhDHUDCaE4ifJcXky8bsieAf_CVe1RS1T3xnJqh_Qyqnet8VY3Sdfpq_putAebiDbO4m8UjVBScamJiuefBywxjXIqSa1ztFiuUOpQQtEFbE5coFK7Zh03zqeOCaIqN7eaI6jtp2QT91Brddhvbkm27Lb3VR4dw7tgFYuaEtMdLbLIbCqxL_KYBCBQF_HncWzmNN13drqTtZxV09gNYaBjASYc20Y0dvfp21Jp",
        alt: "Storefront hero concept: a dark layered page with a jade primary call to action and translucent product cards.",
      },
      {
        kind: "file",
        name: "Tech_Spec_V2.pdf",
        size: "4.2 MB",
        format: "PDF",
      },
    ],
  },

  // ── paid-media-q4 ──
  {
    id: "m-pm-1",
    channelId: "paid-media-q4",
    authorId: "elara-kent",
    sentAt: "2026-07-29T16:40:00Z",
    blocks: [
      {
        kind: "text",
        text: "Training sets have been validated against the baseline. We are blocked on the per-SKU margin table before the bid model can resume.",
      },
      { kind: "file", name: "Margin_Template.xlsx", size: "88 KB", format: "XLSX" },
    ],
  },
  {
    id: "m-pm-2",
    channelId: "paid-media-q4",
    authorId: CLIENT_AUTHOR,
    sentAt: "2026-07-29T17:02:00Z",
    blocks: [
      {
        kind: "text",
        text: "Finance has it — expect the completed sheet back early next week.",
      },
    ],
  },

  // ── brand-guidelines ──
  {
    id: "m-bg-1",
    channelId: "brand-guidelines",
    authorId: "marcus-thorne",
    sentAt: "2026-07-28T09:15:00Z",
    blocks: [
      { kind: "text", text: "Final logo lockups are in review, including the monogram." },
    ],
  },
  {
    id: "m-bg-2",
    channelId: "brand-guidelines",
    authorId: CLIENT_AUTHOR,
    sentAt: "2026-07-28T14:20:00Z",
    blocks: [{ kind: "text", text: "Sent the final SVG assets across." }],
  },

  // ── account-general ──
  {
    id: "m-ag-1",
    channelId: "account-general",
    authorId: "sarah-chen",
    sentAt: "2026-07-27T12:00:00Z",
    blocks: [
      {
        kind: "text",
        text: "Quarterly review is on the calendar for the 14th. Agenda to follow.",
      },
    ],
  },
];

export const messagesFor = (channelId: string) =>
  chatMessages
    .filter((m) => m.channelId === channelId)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));

export const channelById = (id: string) => channels.find((c) => c.id === id);

/** Newest message in a channel — the preview line in the channel list. */
export const latestIn = (channelId: string) => messagesFor(channelId).at(-1);

/** Sidebar badge and header count. Derived, never typed by hand. */
export const totalUnread = channels.reduce((sum, c) => sum + c.unread, 0);

/** Channels ordered by recency, which is how the list is rendered. */
export const channelsByRecency = [...channels].sort((a, b) => {
  const at = latestIn(a.id)?.sentAt ?? "";
  const bt = latestIn(b.id)?.sentAt ?? "";
  return bt.localeCompare(at);
});

export function authorName(id: MessageAuthor, clientName: string) {
  if (id === CLIENT_AUTHOR) return clientName;
  return leadership.find((m) => m.id === id)?.name ?? "Unknown";
}

export function authorRole(id: MessageAuthor) {
  if (id === CLIENT_AUTHOR) return "Client";
  return leadership.find((m) => m.id === id)?.role ?? "";
}

/** First line of a message, for previews. */
export function previewOf(message: ChatMessage) {
  const text = message.blocks.find((b) => b.kind === "text");
  if (text && text.kind === "text") return text.text;
  const file = message.blocks.find((b) => b.kind === "file");
  if (file && file.kind === "file") return `Sent ${file.name}`;
  return message.blocks.some((b) => b.kind === "image") ? "Sent an image" : "";
}

/** Attachment name on a message, if any — shown on the overview preview. */
export function attachmentOf(message: ChatMessage) {
  const file = message.blocks.find((b) => b.kind === "file");
  return file && file.kind === "file" ? file.name : undefined;
}
