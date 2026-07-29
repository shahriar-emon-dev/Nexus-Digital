# Nexus Digital Agency — Structured Stitch UI Prompt Specification
### Master Prompt Library for Designing an Advanced, Interconnected Web Application via Stitch UI / AI Design Engines
*Companion to: Nexus Digital Agency Website Specification v1.0 & Technical Roadmap*

---

## 0. Document Overview & How to Use in Stitch

This document provides a comprehensive library of **structured, copy-pasteable prompts** designed to generate ultra-premium, high-fidelity UI layouts and interactive components using **Stitch** (or advanced AI UI generators such as Lovable, v0, Bolt, and Figma AI).

### Why Structure Matters in AI UI Generation
To prevent disjointed designs, every prompt in this document adheres to a **5-Part Interconnected Architecture Schema**:
1. **Target Role & Route**: Defines the URL path and role-based access level (`PUBLIC`, `CLIENT`, `STAFF`, `ADMIN`).
2. **Aesthetic & Visual Directive**: Enforces world-class design standards (vibrant curated palettes, deep dark/light mode parity, glassmorphism, subtle micro-animations, and typographic hierarchy).
3. **Core UI Components & Widgets**: Specifies the precise shadcn/ui and custom components required (e.g., Kanban dnd-kit boards, Recharts data visualizers, Tiptap rich text editors).
4. **Data & State Interconnection**: Documents exact data bindings from the Prisma schema (`User`, `Client`, `Staff`, `Service`, `Project`, `Card`, `Invoice`, `Meeting`, etc.) and real-time Socket.io/Pusher event triggers.
5. **Inter-Page Navigation & User Flows**: Explains how actions taken on this page ripple across the application and connect to other pages and dashboards.
6. **Copy-Paste Stitch Prompt**: A self-contained, highly detailed prompt block ready to be fed directly into your UI generation tool.

---

## 1. Global Design System & Aesthetic Architecture

When initializing your project or setting up your first design token generation in Stitch, use the following **Global System Prompt** to establish the foundation:

```text
[GLOBAL STITCH DESIGN SYSTEM PROMPT]
Create a state-of-the-art, ultra-premium web application design system for "Nexus Digital Agency" built on Tailwind CSS and shadcn/ui. 
AESTHETICS & THEMING:
- Implement a sophisticated Dual-Theme system (Dark Mode by default, with a crisp, high-contrast Light Mode toggle).
- Color Palette: Primary is Deep Cyber Blue (HSL 220, 90%, 56%) and Electric Cyan (HSL 190, 95%, 50%). Secondary is Violet Fusion (HSL 260, 85%, 60%). Backgrounds in dark mode must use rich obsidian gradients (#0B0F19 to #111827) with subtle noise textures and glowing ambient backdrops.
- Glassmorphism: Use frosted glass cards (`backdrop-blur-md bg-white/5 border border-white/10 dark:bg-black/20 dark:border-white/10`) for all dashboard containers, floating headers, and modal overlays.
- Typography: Use Google Fonts 'Outfit' for punchy, modern geometric headings and 'Inter' for ultra-legible body copy and UI data grids.
- Micro-Animations: Incorporate smooth hover elevations (`hover:-translate-y-1 hover:shadow-cyan-500/20`), button press scales (`active:scale-95`), skeleton loading shimmers, and smooth page transition fades.
- Layout Precision: Ensure 100% responsive behavior across mobile (375px), tablet (768px), desktop (1280px), and ultra-wide monitor (1920px) breakpoints. Never use generic placeholder boxes; generate realistic data representations and sleek UI widgets.
```

---

## 2. Shared Layout Shells (The Interconnection Backbone)

### 2.1 Public / Marketing Layout Shell
* **Route**: `/` (Wraps all public pages: `/services`, `/case-studies`, `/about`, `/pricing`, `/contact`, `/blog`)
* **Target Role**: Public / Prospective Clients
* **Interconnection**: Links to `/auth/login`, `/auth/register`, `/book-meeting`, and dynamic service pages.

```text
[STITCH PROMPT: PUBLIC MARKETING SHELL]
Design a dynamic, responsive Layout Shell for an elite digital agency website.
HEADER / NAVBAR:
- Create a floating, sticky glassmorphic navigation bar (`backdrop-blur-lg bg-slate-900/80 border-b border-white/10`) positioned at the top.
- Left: Nexus Digital Agency logo with an animated glowing gradient mark.
- Center: Navigation links with smooth hover indicators: "Services" (with an interactive mega-menu dropdown showing Core, Specialized, Emerging, and Strategy categories), "Case Studies", "About Us", "Pricing", and "Insights".
- Right: "Client Portal" ghost button (routes to `/auth/login`) and a vibrant primary CTA button "Book Discovery Call" (routes to `/book-meeting`) with a subtle pulsing glow animation.
FOOTER:
- A rich 4-column footer featuring: Agency mission summary, Quick links to all service slugs (`/services/[slug]`), Legal/Privacy links, and an interactive newsletter signup box with instant inline validation.
- Bottom bar: Copyright, live system uptime badge ("All Systems Operational 99.99%"), and social media icons with metallic hover effects.
INTERCONNECTION:
- Ensure the navigation dynamically highlights the active route and provides seamless pre-fetching transitions to all public marketing pages.
```

### 2.2 Client Portal Layout Shell
* **Route**: `/client/*`
* **Target Role**: `CLIENT` (Authenticated Buyer Dashboard)
* **Interconnection**: Connects Client Overview, Projects, Messages, Invoices, Meetings, Reviews, and Settings.

```text
[STITCH PROMPT: CLIENT PORTAL SHELL]
Design a sleek, executive-grade Dashboard Shell for authenticated client portal access.
SIDEBAR NAVIGATION (Left, collapsible on mobile/tablet):
- Top: Agency logo + Client Company Name badge with an interactive "Health Score" indicator (e.g., "Health: 98/100 - Excellent" with a green pulsing dot).
- Navigation Menu (with icons and active state highlights):
  * Overview (`/client`)
  * My Projects (`/client/projects` - includes badge showing count of active projects)
  * Messages & Files (`/client/messages` - includes unread message counter badge)
  * Invoices & Billing (`/client/invoices` - highlights if an invoice is OVERDUE)
  * Meetings (`/client/meetings`)
  * Reviews & Feedback (`/client/reviews`)
  * Account Settings (`/client/settings`)
- Bottom: User profile mini-card (Avatar, Name, Role badge) with a quick Logout button.
TOP COMMAND BAR:
- Global search bar (Cmd+K command palette) to search projects, invoices, and files.
- Right: Theme toggle (Dark/Light), Real-time Notification Bell dropdown (showing recent updates from staff, milestone completions, and payment receipts), and a "Request Support / New Project" quick action CTA.
INTERCONNECTION:
- The sidebar must sync state with the Prisma `Client` and `User` models, updating unread badges in real time via webhooks/sockets when staff post updates.
```

### 2.3 Staff Workspace Layout Shell
* **Route**: `/staff/*`
* **Target Role**: `STAFF` (`TEAM_LEAD`, `SPECIALIST`, `CONTRACTOR`)
* **Interconnection**: Connects Staff Overview, Kanban Boards, Time Tracking, Staff Meetings, and Performance Profile.

```text
[STITCH PROMPT: STAFF WORKSPACE SHELL]
Design a high-productivity, developer-and-specialist focused Workspace Shell for agency staff.
SIDEBAR NAVIGATION:
- Top: Nexus Staff Portal badge + Department Switcher dropdown (e.g., "Engineering & Web", "SEO & Growth", "Paid Media").
- Navigation Menu:
  * Workspace Overview (`/staff`)
  * Project Kanban Boards (`/staff/projects` - categorized by active assignments)
  * Time Tracker & Logs (`/staff/time-logs`)
  * Meeting Calendar (`/staff/meetings`)
  * My Skills & Performance (`/staff/profile`)
- Bottom: Staff role badge indicator showing permission tier (`TEAM_LEAD`, `SPECIALIST`, or `CONTRACTOR`).
FLOATING ACTIVE TIMER WIDGET (Bottom Right):
- A persistent, draggable glassmorphic widget showing currently running timer: Project Name, Card Title, Stopwatch timer (HH:MM:SS), and quick "Pause" / "Stop & Log" buttons. This widget persists across all `/staff/*` page navigations.
TOP HEADER:
- Quick Task Creator button (+ New Card), Team Online presence avatars, and Notification feed for card assignments and client comments.
INTERCONNECTION:
- The floating timer widget must bind to the `TimeLog` state and sync across tabs. If the user is a `CONTRACTOR`, the shell must automatically hide any billing or invoice-related navigation links server-side.
```

### 2.4 Admin Management Layout Shell
* **Route**: `/admin/*`
* **Target Role**: `ADMIN` (Agency Executive / Agency Owner)
* **Interconnection**: Connects Executive Analytics, Clients, Staff, Services Catalog, Project Templates, Invoicing, Review Queue, CMS, and System Settings.

```text
[STITCH PROMPT: ADMIN MANAGEMENT SHELL]
Design a commanding, ultra-comprehensive Executive Control Center Shell for agency administrators.
SIDEBAR NAVIGATION:
- Top: Nexus Admin Command Center branding with live system load and Redis cache health indicators.
- Menu Sections:
  * Executive Analytics (`/admin`)
  * Client Directory & Onboarding (`/admin/clients`)
  * Staff Management & Roles (`/admin/staff`)
  * Services Catalog Editor (`/admin/services`)
  * Project & Kanban Templates (`/admin/projects`)
  * Financials & Invoicing (`/admin/invoices` - shows pending payment volume)
  * Review Moderation Queue (`/admin/reviews/queue` - badge for pending reviews)
  * CMS & Content Editor (`/admin/cms` - Blog, Case Studies, Homepage Sections)
  * System Security & Audit Logs (`/admin/settings`)
TOP EXECUTIVE BAR:
- Global switcher to impersonate Client or Staff view for debugging.
- Real-time revenue ticker (Monthly Recurring Revenue - MRR, Active Pipeline Value).
- Emergency System Lock / Maintenance Mode toggle switch and System Notifications.
INTERCONNECTION:
- Connects directly to all administrative CRUD tables and provides one-click deep links into client workspaces and staff time logs.
```

---

## 3. Public & Marketing Pages (SEO & Conversion Optimized)

### 3.1 High-Impact Homepage
* **Route**: `/`
* **Target Role**: Public
* **Interconnection**: Links to `/services`, `/case-studies`, `/book-meeting`, and displays approved reviews from `Review` table.

```text
[STITCH PROMPT: HIGH-IMPACT HOMEPAGE]
Design a visually stunning, award-winning Homepage for "Nexus Digital Agency" designed to convert high-ticket clients.
HERO SECTION:
- Background: Deep cyber dark gradient with animated floating geometric glowing orbs and subtle grid lines.
- Headline: Bold, high-contrast typography: "Architecting Digital Dominance for Enterprise Brands."
- Sub-headline: "We fuse state-of-the-art web engineering, data-driven growth strategies, and AI automation to scale your revenue."
- CTA Group: Primary glowing button "Schedule Discovery Call" (`/book-meeting`) + Secondary glassmorphic button "Explore Case Studies" (`/case-studies`).
- Social Proof Ticker: "Trusted by industry leaders" featuring sleek monochrome client brand logos.
INTERACTIVE SERVICE SELECTOR (The "What We Build" Grid):
- An interactive 4-tab section displaying categories from the Prisma `Service` model: [Core Services] [Specialized Growth] [Emerging Tech] [Strategic Consulting].
- Clicking a tab reveals 3 interactive glassmorphic service cards with hover-tilt effects, icon badges, starting price indicators, and a "Explore Service →" link pointing to `/services/[slug]`.
LIVE IMPACT METRICS COUNTER:
- A 4-column counter section with animated count-up numbers: "$45M+ Client Revenue Generated", "99.8% On-Time Delivery", "150+ Enterprise Projects", "98/100 Average Client Health Score".
FEATURED CASE STUDIES CAROUSEL:
- A sleek horizontal carousel showcasing top projects from the `CaseStudy` model. Each slide features a high-res cover image, Client Name, Industry tag, bold metric callout (e.g., "+340% Organic Traffic in 6 Months"), and a link to read the full study.
CLIENT TESTIMONIALS & REVIEWS WALL:
- A masonry grid of verified client reviews pulled dynamically from the `Review` table (where `status == APPROVED`). Each review card features star rating icons, quote text, client avatar, company name, and a verified buyer badge. Include invisible JSON-LD structured data for Google Review Rich Snippets.
FINAL CTA BANNER:
- A full-width gradient banner with a CTA: "Ready to accelerate your digital trajectory? Let's build something extraordinary." with an instant meeting booker button.
```

### 3.2 Services Directory & Comparison Matrix
* **Route**: `/services`
* **Target Role**: Public
* **Interconnection**: Filters `Service` records by category and pricing model; links to `/services/[slug]` and `/book-meeting`.

```text
[STITCH PROMPT: SERVICES DIRECTORY]
Design an interactive, highly analytical Services Directory page for exploring agency offerings.
PAGE HEADER:
- Title: "Our Specialized Capabilities & Pricing Models"
- Subtitle: "Transparent, scalable solutions tailored to your growth stage."
INTERACTIVE FILTERING & PRICING BAR:
- Category Pill Filters: All | Core | Specialized | Emerging | Strategy.
- Pricing Model Toggle: All | Retainer | Project-Based | Performance | Hourly | Package.
- Search input to filter services by keyword or tech stack (e.g., "Next.js", "SEO", "PPC").
SERVICE CARDS GRID:
- A responsive 3-column grid of service cards pulled from the `Service` Prisma model.
- Card Design: Frosted glass container with a subtle category color accent border.
- Card Header: Service Icon, Name, and Category badge.
- Card Body: Short description, Pricing Model badge (e.g., "Monthly Retainer"), and Starting Price highlighted in bold cyan typography (e.g., "From $3,500/mo").
- Card Footer: Key features list (top 3 bullets from `features` JSON) and two buttons: "View Details" (`/services/[slug]`) and "Book This Service" (`/book-meeting?service=[slug]`).
COMPARISON MATRIX TABLE:
- An enterprise-style comparison table at the bottom comparing Engagement Models (Retainer vs. Project vs. Advisory), detailing Dedicated Staffing, Response Times, Strategy Reviews, and IP Ownership.
```

### 3.3 Service Detail Page (Dynamic Slug)
* **Route**: `/services/[slug]`
* **Target Role**: Public
* **Interconnection**: Deep-dives into a specific `Service` record; dynamically feeds selected service into `/book-meeting` and displays related `Project` case studies and `Review` feedback.

```text
[STITCH PROMPT: SERVICE DETAIL PAGE]
Design a high-converting, deeply informative Service Detail Page for a specific agency offering (e.g., "Enterprise SEO Retainer" or "Custom Next.js Web Development").
HERO BANNER:
- Left: Service Title, Category Badge, and Rich Summary.
- Right: Interactive Pricing & ROI Calculator Widget where visitors can slide their current monthly traffic/revenue to estimate projected growth and ROI from this service.
DETAILED CAPABILITY BREAKDOWN (Tiptap Rich Text Display):
- A multi-section typography layout displaying `fullDescription`, architectural diagrams, and methodology steps.
DELIVERABLES & TIMELINE ROADMAP:
- An interactive visual timeline (Step 1: Audit & Discovery -> Step 2: Architecture & Strategy -> Step 3: Execution & Sprinting -> Step 4: Optimization & Handover).
- A checklist box displaying exact tangible deliverables pulled from `deliverables` JSON (e.g., "Weekly Technical SEO Audit Reports", "Dedicated Slack Channel", "Custom Looker Studio Dashboard").
REVIEWS & RELATED CASE STUDIES:
- A dedicated section showing verified client reviews specifically tagged with this `serviceId`.
- 2 related case study preview cards showing real-world results achieved with this service.
STICKY BOTTOM/SIDE ACTION BAR:
- A floating summary box displaying: "Pricing Model: [PricingModel] | Starting at $[startingPrice]".
- Primary CTA Button: "Schedule Technical Discovery Call for [Service Name]" which redirects to `/book-meeting?serviceId=[id]`, pre-populating the booking wizard.
```

### 3.4 Case Studies & Portfolio Showcase
* **Route**: `/case-studies` & `/case-studies/[slug]`
* **Target Role**: Public
* **Interconnection**: Pulls from `CaseStudy` model; links to relevant services used in the project.

```text
[STITCH PROMPT: CASE STUDIES SHOWCASE]
Design an editorial, data-centric Case Studies and Portfolio Showcase page.
FILTERING WORKSPACE:
- Filter by Industry: All | FinTech | E-Commerce | Healthcare | SaaS | AI / DeepTech.
- Filter by Service Used: SEO | Web Development | Paid Media | Brand Strategy.
CASE STUDY GRID:
- Asymmetrical editorial layout featuring large hero cards for featured projects and 2-column cards for standard studies.
- Each card displays: High-resolution product mockup/cover image with hover-zoom effect, Client Name, Industry Pill, Bold Primary Metric (in massive glowing font, e.g., "+420% Conversion Rate"), and a brief executive summary.
INDIVIDUAL CASE STUDY DETAIL PAGE (`/case-studies/[slug]`):
- Header: Client Logo, Project Title, and Key Metrics Banner (3 stat callouts).
- Body: "The Challenge", "The Strategic Solution", and "The Execution & Architecture".
- Interactive Before/After Visual Slider: Allow users to drag a slider to compare the client's old legacy website/metrics vs. the new Nexus-engineered solution.
- Client Testimonial Quote Callout: Large blockquote with client CEO/Founder headshot and signature.
- Footer: "Services Deployed in this Project" (clickable chips linking to `/services/[slug]`) + CTA to "Achieve Similar Results -> Book Discovery Call".
```

### 3.5 Agency Snapshot / About Us
* **Route**: `/about`
* **Target Role**: Public
* **Interconnection**: Pulls active staff profiles from `Staff` and `User` models (where `isActive == true` and flagged for public leadership display).

```text
[STITCH PROMPT: ABOUT US & AGENCY SNAPSHOT]
Design a modern, inspiring "About Us / Agency Snapshot" page conveying technical authority and human trust.
AGENCY PHILOSOPHY HERO:
- Bold statement on why Nexus was founded: moving away from bloated, slow agency models to agile, engineering-first, data-backed execution.
INTERACTIVE GROWTH TIMELINE:
- A horizontal scrollable or vertical snake timeline highlighting key agency milestones: Founded -> First Enterprise Client -> Reached 50+ Team Members -> Expanded to AI & Big Data Solutions.
LEADERSHIP & SPECIALIST DIRECTORY:
- A grid of team member cards pulled from public leadership profiles in the `Staff`/`User` tables.
- Each card shows: High-res professional avatar, Name, Department, Staff Role badge (`Team Lead`, `Principal Architect`), and interactive skill tags (e.g., `Next.js`, `System Architecture`, `Technical SEO`).
- Hovering over a card reveals a quote or their favorite tech stack.
LIVE AGENCY PULSE WIDGET:
- A data dashboard preview showing real-time agency health metrics: "Active Projects in Development: 24", "Total Git Commits This Month: 1,420", "Average Client Satisfaction: 4.9/5.0".
```

### 3.6 Blog & Insights CMS Directory
* **Route**: `/blog` & `/blog/[slug]`
* **Target Role**: Public
* **Interconnection**: Pulls from `BlogPost` model; links articles to related services and conversion CTAs.

```text
[STITCH PROMPT: BLOG & INSIGHTS DIRECTORY]
Design a clean, highly readable thought-leadership Blog & Insights publication platform.
DIRECTORY LAYOUT (`/blog`):
- Featured Article Hero: Large cover image, category tag, author avatar, reading time indicator (e.g., "7 min read"), bold title, and summary excerpt.
- Category Navigation: All | Engineering | Growth Strategy | AI & Automation | Case Decodes.
- Article Grid: 3-column layout of blog cards with publication date (`publishedAt`), author name, and social share metrics.
ARTICLE DETAIL PAGE (`/blog/[slug]`):
- Reading Progress Bar at the very top of the viewport scrolling dynamically.
- Left/Right Sidebar: Sticky Table of Contents (auto-generated from H2/H3 tags) and instant social share buttons (LinkedIn, X, Copy Link).
- Typography Centerpiece: Clean, narrow reading column (max-w-prose) optimized for readability with styled code blocks (syntax highlighting), blockquotes, callout alert boxes, and embedded charts.
- Inline Conversion Box: Mid-article glassmorphic banner: "Enjoying this technical breakdown? Let our engineering team implement this for your brand. -> Schedule a Consultation."
```

### 3.7 Dynamic Pricing & Custom Package Builder
* **Route**: `/pricing`
* **Target Role**: Public
* **Interconnection**: Integrates with `Service` pricing models; feeds configured packages directly into `/book-meeting` or `/auth/register`.

```text
[STITCH PROMPT: DYNAMIC PRICING & PACKAGE BUILDER]
Design an interactive, transparent Pricing Page featuring standard tiers and a custom package builder.
BILLING PERIOD TOGGLE:
- A smooth animated pill switch: "Monthly Retainer" vs. "Annual Commitment (Save 15%)".
TIERED PRICING TABLES (3 Columns):
- Columns: [Growth Kickstart] [Enterprise Scale] [Dedicated Team / Custom].
- Each column features: Price tag, Target audience description, List of included services/features with checkmarks, Response time SLA guarantee, and a "Select Plan" button linking to `/book-meeting?plan=[tier]`.
- Highlight the middle [Enterprise Scale] tier with a glowing "Most Popular / Recommended" border and badge.
INTERACTIVE CUSTOM PACKAGE BUILDER WIDGET:
- An interactive calculator section where users can build their own custom retainer by toggling checkboxes and sliders:
  * Checkbox: Dedicated SEO Specialist (+$2,500/mo)
  * Checkbox: Full-Stack Next.js Engineering Pod (+$6,000/mo)
  * Slider: Monthly Paid Media Ad Spend Management ($10k to $500k range)
  * Checkbox: 24/7 Priority Server & Uptime Monitoring (+$800/mo)
- Dynamic Total Calculator: Displays real-time estimated monthly investment as the user toggles options.
- Action Button: "Lock In Custom Package & Book Strategy Call" -> passes all selected options via URL parameters to `/book-meeting`.
FAQ ACCORDION:
- Clean expandable accordion answering top billing questions (contract terms, cancellation policies, IP ownership, invoicing methods).
```

### 3.8 Interactive Contact & Discovery Call Booking Wizard
* **Route**: `/contact` & `/book-meeting`
* **Target Role**: Public
* **Interconnection**: Creates a record in the `Meeting` table; triggers email confirmations via Resend; notifies Admin/Staff calendar; converts visitor into prospective Client in Admin onboarding.

```text
[STITCH PROMPT: DISCOVERY CALL BOOKING WIZARD]
Design an interactive, step-by-step Discovery Call Booking Wizard (`/book-meeting`) that replaces traditional boring contact forms with an engaging consultative intake experience.
WIZARD PROGRESS BAR:
- Top indicator showing 4 clear steps: [1. Select Services] -> [2. Project Scope & Budget] -> [3. Select Date & Time] -> [4. Contact Details & Confirmation].
STEP 1: SERVICE SELECTION:
- Grid of selectable service cards with checkboxes (pre-selected if navigated from a Service Detail or Pricing page). Users can select multiple services (e.g., Web Development + SEO).
STEP 2: SCOPE & BUDGET INTAKE:
- Interactive Budget Range Slider or Pill Selectors: "< $10k", "$10k - $25k", "$25k - $50k", "$50k - $100k+", or "Monthly Retainer ($5k+/mo)".
- Timeline urgency selector: "Immediate Start", "Within 30 Days", "Exploratory / Q3".
STEP 3: INTERACTIVE CALENDAR SCHEDULER (Integrated `react-day-picker`):
- Left: Calendar date picker showing available agency slots (blocking out weekends and booked times).
- Right: Time slot buttons (in user's local timezone with timezone selector dropdown, e.g., "10:00 AM EST", "2:00 PM EST").
STEP 4: CONTACT DETAILS & SUBMIT:
- Clean form fields: Full Name (`visitorName`), Work Email (`visitorEmail`), Company Name, Phone Number, and Project Notes / Website URL.
- Submit Button: "Confirm & Schedule Discovery Call" with loading spinner and success checkmark animation.
CONFIRMATION SCREEN:
- Confirms meeting scheduled! Displays calendar invite download buttons (.ics, Google Calendar, Outlook), assigned Meeting Type ("Technical Discovery Call"), and a prompt: "Want to track your proposal and project status? -> Create your Client Portal Account now" linking to `/auth/register?email=[email]`.
```

---

## 4. Authentication & Onboarding Flows

### 4.1 Login, Registration & 2FA Verification
* **Route**: `/auth/login`, `/auth/register`, `/auth/2fa/verify`
* **Target Role**: Public -> Authenticated (`CLIENT`, `STAFF`, `ADMIN`)
* **Interconnection**: Validates against `User` table; sets JWT session; checks `twoFactorEnabled`; middleware routes user to their respective role dashboard (`/client`, `/staff`, or `/admin`).

```text
[STITCH PROMPT: AUTHENTICATION & ONBOARDING SUITE]
Design an ultra-secure, visually captivating Authentication & Onboarding Suite (`/auth/*`).
SPLIT-SCREEN LAYOUT:
- Left Pane (Desktop): Ambient animated cyber graphic with agency branding, rotating client success quotes, and security badges ("256-bit SSL Encryption", "SOC2 Compliant Architecture").
- Right Pane: Glassmorphic authentication form container centered vertically and horizontally.
LOGIN PAGE (`/auth/login`):
- Heading: "Welcome Back to Nexus Portal"
- Form Fields: Email Address and Password with a "Forgot Password?" link.
- Social Auth: "Continue with Google" button with official Google brand icon and clean border.
- Role Preview Indicator: Subtle informational badge noting that system automatically routes to Client, Staff, or Admin portal based on account credentials.
REGISTRATION / CLIENT ONBOARDING (`/auth/register`):
- Heading: "Create Your Client Portal Account"
- Fields: Full Name, Work Email Address, Company Name, Industry dropdown, Phone Number, and Password strength meter (checking length, symbols, numbers).
- Terms Checkbox: "I agree to the Nexus Master Services Agreement and Privacy Policy."
2FA VERIFICATION MODAL / PAGE (`/auth/2fa/verify`):
- Triggered automatically during login if `twoFactorEnabled == true`.
- UI: Crisp modal featuring a 6-digit OTP code input box (auto-focusing, jumping to next box on digit entry).
- Helper links: "Resend Code via Email" or "Use Backup Recovery Code".
- Button: "Verify & Enter Portal" with instant cryptographic verification feedback.
```

---

## 5. Client Portal Pages (`/client/*`)

### 5.1 Client Overview Dashboard
* **Route**: `/client`
* **Target Role**: `CLIENT`
* **Interconnection**: Pulls from `Client`, `Project`, `Invoice`, `Message`, and `Meeting` models. Acts as the command hub linking to all detail pages.

```text
[STITCH PROMPT: CLIENT OVERVIEW DASHBOARD]
Design an executive-grade Client Overview Dashboard (`/client`) providing instant clarity on project velocity, financials, and communications.
WELCOME HERO BANNER:
- Personalized greeting: "Welcome back, [Company Name] Team."
- Right side: Prominent Client Health Score Gauge Widget (e.g., 96/100) with a tooltip explaining score factors (on-time payments, active communication, project milestone velocity).
TOP KPI METRIC CARDS (4 Grid):
- Card 1: Active Projects (Count + link to `/client/projects`).
- Card 2: Next Milestone Due (Milestone Name, Project Name, Countdown timer in days).
- Card 3: Unread Messages (Count + link to `/client/messages`).
- Card 4: Billing Status (Total Outstanding Balance + "Pay Now" CTA button linking to `/client/invoices`).
ACTIVE PROJECTS VELOCITY GRID:
- List of active projects from `Project` model where `status == ACTIVE`.
- Each project card displays: Project Title, Assigned Team Lead Avatar, Progress Bar showing `completionPercent` (e.g., 68%), Current Active Stage (e.g., "Sprint 3: Frontend Integration"), and a "View Project Board ->" button.
RECENT COMMUNICATIONS & UPCOMING MEETINGS SPLIT SECTION:
- Left Column: Recent Messages feed showing latest chat snippets from staff with timestamp and attachment icons.
- Right Column: Upcoming Meetings widget showing next scheduled Discovery or Strategy call with an instant "Join Video Room" button (`meetingLink`).
```

### 5.2 My Projects & Read-Only Kanban Tracker
* **Route**: `/client/projects` & `/client/projects/[id]`
* **Target Role**: `CLIENT`
* **Interconnection**: Pulls from `Project`, `Column`, `Card`, `Milestone`, and `ProjectFile` (where `readyForClient == true`). Links to Project Messages and Invoices.

```text
[STITCH PROMPT: CLIENT PROJECTS & ROADMAP TRACKER]
Design a transparent, confidence-inspiring Project Tracking Portal (`/client/projects` & `/client/projects/[id]`) for clients.
PROJECTS LIST VIEW (`/client/projects`):
- Filter tabs: All Projects | Active | On Hold | Completed | Archived.
- Grid of comprehensive project summary cards showing start/end dates, total budget spent vs. allocated, completion percentage, and team roster.
PROJECT DETAIL VIEW (`/client/projects/[id]`):
- Top Navigation Sub-menu: [Milestone Roadmap] [Kanban Progress Board] [Deliverables & Files] [Project Invoices].
- TAB 1: MILESTONE ROADMAP (Default view):
  * A vertical or horizontal interactive GANTT/Milestone timeline showing completed milestones (green checkmark), current in-progress milestone (pulsing cyan highlight), and upcoming deliverables with exact due dates.
- TAB 2: READ-ONLY KANBAN BOARD:
  * A clean, read-only visualization of the project's Kanban columns (`Column` and `Card` models): [Backlog] -> [In Progress] -> [Client Review Required] -> [Completed].
  * Cards in "Client Review Required" feature a prominent "Review & Approve Deliverable" action button!
- TAB 3: DELIVERABLES & FILE VAULT (`ProjectFile` table):
  * A secure document repository listing all uploaded files where `readyForClient == true`.
  * Displays: File Icon, Filename, Version number (e.g., `v2.4`), Uploaded Date, and instant Download button. Include a dropzone for clients to upload requested assets or brand guidelines.
```

### 5.3 Client Communication & Messages Hub
* **Route**: `/client/messages` & `/client/messages/[projectId]`
* **Target Role**: `CLIENT`
* **Interconnection**: Two-way real-time chat bound to `Message` model and Socket.io/Pusher channels. Links messages to specific `Project` records and file attachments.

```text
[STITCH PROMPT: CLIENT MESSAGES HUB]
Design a real-time, Slack-style Communication Hub (`/client/messages`) integrated directly into the client portal.
SPLIT-SCREEN CHAT INTERFACE:
- Left Sidebar (Project Channels): List of user's active projects (e.g., `# SEO Retainer - Q3`, `# Next.js Website Redesign`). Shows unread message count badges and last message timestamp.
- Main Chat Window (Right):
  * Header: Project Channel Name, Assigned Staff Roster avatars (with online/offline status dots), and a "Search Messages" input.
  * Message Thread: Chronological message bubbles. Staff messages appear on the left with distinctive agency badges ("Nexus Team Lead", "SEO Specialist"). Client messages appear on the right.
  * Rich Media Support: Messages display inline image previews, PDF attachment cards with download links, and formatted code/text snippets.
  * Message Composer (Bottom): Rich text input box with formatting buttons (Bold, Bullet list, Code), File Attachment upload clip (supporting drag-and-drop up to 50MB), and an animated "Send Message" button.
INTERCONNECTION:
- Incoming messages must trigger real-time sound/visual notifications and update the unread counter in the global Client Portal Shell sidebar without page refreshes.
```

### 5.4 Invoices & Stripe Billing Center
* **Route**: `/client/invoices` & `/client/invoices/[id]`
* **Target Role**: `CLIENT`
* **Interconnection**: Pulls from `Invoice` model; integrates with Stripe API for instant payment processing; updates project billing status and unlocks deliverable downloads upon payment completion.

```text
[STITCH PROMPT: CLIENT INVOICES & BILLING CENTER]
Design a pristine, transparent Financial & Billing Center (`/client/invoices`) with seamless Stripe checkout integration.
INVOICE DIRECTORY (`/client/invoices`):
- Financial Summary Banner: Total Paid to Date, Current Outstanding Balance, and Next Recurring Billing Date.
- Filter Tabs: All Invoices | Unpaid / Due | Paid | Overdue | Recurring Retainers.
- Invoices Data Table:
  * Columns: Invoice ID (e.g., `INV-2026-0042`), Project / Service Reference, Issue Date, Due Date, Amount (`total`), Status Badge (Draft = Gray, Sent/Unpaid = Yellow, Paid = Green, Overdue = Glowing Red), and Action button.
INVOICE DETAIL & PAYMENT VIEW (`/client/invoices/[id]`):
- Professional Digital Invoice Document layout:
  * Header: Nexus Agency Tax ID/Address vs. Client Bill-To Address.
  * Line Items Table (`lineItems` JSON): Description of services/hours, Unit Price, Quantity/Hours, and Line Total.
  * Financial Calculation Box: Subtotal, Discount (`discount`), Tax (`tax`), and Total Due (`total`).
  * Recurring Badge: Highlights if this is an automated monthly retainer (`isRecurring == true`).
- PAYMENT ACTION CONTAINER (Right/Bottom Sticky):
  * If Status == PAID: Displays large green verification stamp "PAID IN FULL on [paidAt Date]" + "Download PDF Receipt" button.
  * If Status == SENT / OVERDUE: Displays integrated Stripe Embedded Checkout Card allowing instant credit card, ACH, or Apple Pay payment directly within the portal.
  * Alternative Payment Instructions: Collapsible accordion showing manual bank transfer / bKash / Nagad wire instructions with an "Upload Payment Reference / Transaction ID" submission form.
```

### 5.5 Client Meetings & Schedule Manager
* **Route**: `/client/meetings`
* **Target Role**: `CLIENT`
* **Interconnection**: Pulls from `Meeting` table; syncs with staff availability; allows scheduling new project meetings or rescheduling existing ones.

```text
[STITCH PROMPT: CLIENT MEETINGS MANAGER]
Design a clean, calendar-integrated Meetings & Schedule Manager (`/client/meetings`).
UPCOMING MEETINGS HERO CARDS:
- Displays confirmed upcoming meetings from `Meeting` model where `status == CONFIRMED`.
- Card Details: Meeting Type badge ("Monthly Strategy Review", "Technical Architecture Sync"), Date & Time (formatted with countdown, e.g., "Tomorrow in 14 hours"), Assigned Staff Members with avatars, Agenda notes, and two prominent buttons: "Join Video Conference" (`meetingLink` - glowing cyan button) and "Reschedule / Cancel".
MEETING HISTORY & NOTES LOG:
- A data grid showing past completed meetings (`status == COMPLETED`).
- Expandable rows allowing the client to view post-meeting action items, summary notes (`notes` field entered by staff), and downloadable recording links.
BOOK NEW MEETING CTA MODAL:
- A floating action button "+ Schedule Strategy Call" opening an inline modal version of the calendar scheduling wizard, automatically locked to the client's account and assigned project team leads.
```

### 5.6 Client Reviews & Feedback Portal
* **Route**: `/client/reviews`
* **Target Role**: `CLIENT`
* **Interconnection**: Creates records in `Review` model with `status == PENDING`; links feedback to specific `Service` or `Project`; once approved by Admin, feeds directly to Public Homepage and Service pages.

```text
[STITCH PROMPT: CLIENT REVIEWS & FEEDBACK PORTAL]
Design an engaging, rewarding Client Reviews & Feedback Portal (`/client/reviews`).
FEEDBACK SUBMISSION WIZARD:
- Heading: "Share Your Experience & Shape Our Agency Roadmap"
- Service / Project Selector: Dropdown allowing client to select which active or completed project/service they are reviewing (`serviceId`, `projectId`).
- Interactive Star Rating: 5 large animated interactive stars (1 to 5 rating). Hovering changes star colors to glowing gold with descriptive labels (1 = Needs Improvement, 5 = World-Class Excellence).
- Detailed Review Composer: Rich text area for client testimonial (`content`).
- Public Display Permission Checkbox: "Allow Nexus to feature this review and my company logo on the public agency portfolio and marketing pages."
- Submit Button: "Submit Review" with confetti animation upon successful submission!
MY SUBMITTED REVIEWS HISTORY:
- List of past submitted reviews showing Rating, Date, Review Text, Current Status Badge (Pending Moderation, Approved & Featured, Archived), and any official Admin Reply (`adminReply`).
```

### 5.7 Client Account Settings & Security
* **Route**: `/client/settings`
* **Target Role**: `CLIENT`
* **Interconnection**: Modifies `Client` and `User` models; manages 2FA secrets (`twoFactorEnabled`, `twoFactorSecret`); updates notification webhook preferences.

```text
[STITCH PROMPT: CLIENT ACCOUNT SETTINGS]
Design an executive Account Settings & Security Control Panel (`/client/settings`).
TABBED SETTINGS INTERFACE: [Company Profile] [User Security & 2FA] [Notification Preferences] [Billing Contacts].
TAB 1: COMPANY PROFILE (`Client` model):
- Editable fields: Company Name, Industry dropdown, Primary Phone Number, Corporate Website URL, and General Account Notes / Billing Address.
- Company Logo / Avatar upload dropzone with image cropping preview.
TAB 2: SECURITY & 2FA (`User` model):
- Password Change form (Current Password, New Password, Confirm New Password).
- Two-Factor Authentication (2FA) Card:
  * Status toggle switch (Enable/Disable 2FA).
  * If enabling: Displays QR Code for Google Authenticator / Authy, manual secret key string, and an input box to verify the first TOTP code before activating.
TAB 3: NOTIFICATION PREFERENCES:
- Toggle switches for Email and Portal notifications: "New project milestone completed", "New invoice issued", "Staff replied to message thread", "Meeting reminder (24h and 1h prior)".
```

---

## 6. Staff Workspace Pages (`/staff/*`)

### 6.1 Staff Overview Dashboard
* **Route**: `/staff`
* **Target Role**: `STAFF` (`TEAM_LEAD`, `SPECIALIST`, `CONTRACTOR`)
* **Interconnection**: Pulls assigned tasks from `ProjectStaff`, `Card`, `TimeLog`, and `Meeting`. Provides immediate jump points to Kanban boards and active time tracking.

```text
[STITCH PROMPT: STAFF OVERVIEW DASHBOARD]
Design a high-octane, productivity-focused Staff Workspace Overview (`/staff`) tailored for developers, designers, and growth specialists.
WELCOME & PRODUCTIVITY TICKER:
- Top bar showing Staff Name, Role Badge (`TEAM_LEAD` / `SPECIALIST` / `CONTRACTOR`), Department, and Today's Logged Hours vs. Weekly Target (e.g., "Today: 6.5h / 8.0h | Weekly Target: 32h / 40h" with an animated progress bar).
MY ASSIGNED TASKS DUE SOON (The Priority Matrix):
- A filtered task list showing Kanban cards (`Card` model) assigned to this user (`assignees` contains `user.id`) sorted by `dueDate` and `priority`.
- Each task item shows: Priority Flag (Critical = Red, High = Orange, Medium = Yellow), Card Title, Project Name badge, Due Date countdown, Checklist progress (e.g., "3/5 items"), and a quick-action play button "Start Timer & Open Card" which instantly launches the floating stopwatch timer and opens the card modal!
TODAY'S SCHEDULED MEETINGS & CLIENT CALLS:
- Chronological list of today's meetings (`Meeting` table where `staffId == self`). Shows Client Name, Meeting Type, Time slot, and one-click "Start / Join Call" button.
RECENT PROJECT ACTIVITY STREAM:
- Real-time feed of actions taken across assigned projects (`CardActivity` model): e.g., "Alex (Client) commented on card [SEO Audit Report]", "Sarah (Admin) moved [Homepage Redesign] to Client Review".
```

### 6.2 Interactive Project Kanban Board
* **Route**: `/staff/projects` & `/staff/projects/[id]`
* **Target Role**: `STAFF` (Filtered by role permissions: Contractors see stripped financial data)
* **Interconnection**: Full CRUD on `Column`, `Card`, `CardActivity`, and `TimeLog`. Drag-and-drop state syncs via Socket.io/Pusher to all connected staff and client dashboards.

```text
[STITCH PROMPT: STAFF INTERACTIVE KANBAN BOARD]
Design a world-class, ultra-fluid interactive Project Kanban Board (`/staff/projects/[id]`) powered by `@dnd-kit` drag-and-drop architecture.
KANBAN BOARD HEADER:
- Left: Project Title, Client Company Name badge, Project Status dropdown (`DRAFT`, `ACTIVE`, `ON_HOLD`, `COMPLETED`), and Priority Indicator.
- Right: Filter bar (Filter by Assignee avatar, Filter by Priority, Search card titles), "Project Budget / Billable Hours" summary (NOTE: Automatically stripped and hidden if logged-in user is a `CONTRACTOR`!), and a "+ Add Column" button.
MULTI-COLUMN KANBAN LAYOUT (`Column` & `Card` models):
- Horizontal scrolling board displaying customizable columns (e.g., [Backlog] -> [In Progress] -> [Internal QA] -> [Client Review] -> [Done]).
- Column Header: Column Name, Card count badge, and quick "+ Add Card" button.
- Draggable Card Design:
  * Frosted glass card with priority color border bar on the left edge.
  * Card Title and optional preview description snippet.
  * Checklist progress bar (e.g., "4/6 completed").
  * Attached file counter icon and comment counter icon.
  * Assignee avatar cluster (overlapping mini profile pictures).
  * Due Date tag (turns glowing red if overdue!).
INTERACTIVE CARD DETAIL MODAL (Triggered on Card Click):
- A comprehensive modal overlay featuring:
  * Title editor and Markdown description editor.
  * Assignee multi-select dropdown and Priority selector (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
  * Interactive Checklist builder (add/check/delete sub-tasks).
  * Attachments dropzone (`attachments` JSON / S3 upload).
  * Time Logging Tab: Shows all `TimeLog` entries recorded against this card, total minutes spent, and a manual "+ Log Time" form (Hours/Minutes + Note).
  * Activity & Comment Thread (`CardActivity` & `Message`): Chronological audit log of column moves and team/client comments with rich text reply box.
```

### 6.3 Time Tracking & Log Manager
* **Route**: `/staff/time-logs`
* **Target Role**: `STAFF`
* **Interconnection**: Creates and edits records in `TimeLog` model; aggregates billable hours into `Project.billableHours` and feeds into Admin payroll/invoicing calculations.

```text
[STITCH PROMPT: STAFF TIME TRACKING & LOGS]
Design a meticulous, comprehensive Time Tracking & Timesheet Manager (`/staff/time-logs`).
TOP STATS & TIMESHEET HEADER:
- Weekly Summary Cards: Total Hours Logged This Week, Billable vs. Non-Billable breakdown chart, and Average Daily Velocity.
- Date Range Selector: Current Week (with weekday tabs Mon-Sun) or Month View picker.
LOG TIME QUICK-ENTRY BAR (Sticky Top Form):
- An inline rapid-entry form:
  * Project Dropdown (Select active project).
  * Card / Task Dropdown (Filtered dynamically based on selected project).
  * Duration Input (Hours & Minutes, e.g., `02:30` or decimal `2.5`).
  * Note / Description input (e.g., "Refactored Prisma schema and added role middleware").
  * Button: "+ Log Time" (instantly commits to DB and updates weekly total).
TIMESHEET DATA GRID:
- Comprehensive table listing all historical time logs (`TimeLog` model where `staffId == self`).
- Columns: Date/Time Logged (`loggedAt`), Project Name, Card Title reference, Duration (formatted in hours/mins), Staff Note, and Edit/Delete action icons (editable within 24 hours of submission).
- Group rows by Date with daily subtotal headers!
```

### 6.4 Staff Meetings & Calendar
* **Route**: `/staff/meetings`
* **Target Role**: `STAFF`
* **Interconnection**: Pulls from `Meeting`, `Client`, and `Staff` models; allows staff to review discovery call intake notes and convert prospective calls into active projects.

```text
[STITCH PROMPT: STAFF MEETINGS & CALENDAR]
Design an integrated Staff Meetings Calendar & Intake Viewer (`/staff/meetings`).
CALENDAR & LIST VIEW TOGGLE:
- Full interactive monthly/weekly calendar grid (react-big-calendar style) showing all scheduled calls across the staff member's department.
MEETING DETAIL & INTAKE DRAWER (Opens on Meeting Click):
- A slide-out right drawer displaying complete meeting context from `Meeting` table:
  * Meeting Status Badge (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).
  * Scheduled Date, Time, and Video Conference Link (`meetingLink` with copy button).
  * Visitor / Client Details: Name (`visitorName`), Email (`visitorEmail`), Company, and Stated Budget Range (`budgetRange`, e.g., "$25k - $50k").
  * Pre-Call Intake Notes: Full text of project scope submitted by visitor during booking wizard.
- STAFF ACTION CONTROLS:
  * Notes Editor: Rich text box for staff to take real-time notes during the discovery call (`notes` field).
  * Status Updater buttons: Mark as Completed | Mark as No-Show | Reschedule.
  * CONVERSION CTA (If Meeting is Discovery Call): A prominent button "Convert Meeting to Active Project ->" which opens the Project Creation Wizard pre-populated with the visitor's company name, budget, and selected services!
```

### 6.5 Staff Profile & Performance Metrics
* **Route**: `/staff/profile`
* **Target Role**: `STAFF`
* **Interconnection**: Reads and updates `Staff` and `User` models; manages skills array (`skills`); displays personal productivity analytics.

```text
[STITCH PROMPT: STAFF PROFILE & PERFORMANCE]
Design an empowering Staff Profile & Personal Performance Center (`/staff/profile`).
PROFILE HEADER:
- User Avatar upload, Full Name, Email, Department tag, and official Staff Role Badge (`TEAM_LEAD`, `SPECIALIST`, or `CONTRACTOR`).
SKILLS & SPECIALIZATION MATRIX (`skills` string array):
- Interactive tag editor where staff can add/remove technical skills and certifications (e.g., `TypeScript`, `Next.js App Router`, `Prisma ORM`, `Technical SEO`, `Stripe API`, `Google Ads`). These tags are used by Admin when assigning staff to specialized project cards!
PERSONAL PRODUCTIVITY & ANALYTICS DASHBOARD:
- Recharts visualizations showing personal output over the last 30/90 days:
  * Hours Logged per Week bar chart.
  * Project Distribution pie chart (showing percentage of time spent across different clients/services).
  * Task Completion Velocity (number of Kanban cards moved to Completed per sprint).
ACCOUNT SECURITY TAB:
- Password change form and 2FA authentication management.
```

---

## 7. Admin Dashboard & Management Pages (`/admin/*`)

### 7.1 Admin Executive Analytics Dashboard
* **Route**: `/admin`
* **Target Role**: `ADMIN`
* **Interconnection**: Aggregates data across the entire database (`User`, `Client`, `Staff`, `Service`, `Project`, `Invoice`, `Review`, `Meeting`). Integrates with Google Analytics 4 (GA4) and Stripe APIs.

```text
[STITCH PROMPT: ADMIN EXECUTIVE ANALYTICS DASHBOARD]
Design a breathtaking, all-powerful Executive Control Center Dashboard (`/admin`) for agency leadership.
TOP EXECUTIVE KPI RIBBON (5 Glowing Glassmorphic Cards):
- Card 1: Monthly Recurring Revenue (MRR) — e.g., "$128,450" (+14.2% MoM green trendline arrow).
- Card 2: Total Outstanding / Unpaid Invoices — e.g., "$34,200" (with alert badge if overdue > 30 days).
- Card 3: Active Client Pipeline & Health — e.g., "42 Active Clients" (Average Health Score: 94/100).
- Card 4: Active Projects in Flight — e.g., "38 Projects" (6 flagged as On Hold / Delayed).
- Card 5: Monthly Discovery Calls Booked — e.g., "24 Calls" (Conversion rate to project: 65%).
INTERACTIVE FINANCIAL & REVENUE CHARTS (Recharts Integration):
- Main Chart Area: AreaChart displaying 12-Month Revenue Trend comparing Retainer Revenue vs. One-Off Project Revenue vs. Target Forecast.
- Side Chart: PieChart showing Revenue Distribution by Service Category (`CORE`, `SPECIALIZED`, `EMERGING`, `STRATEGY`).
CLIENT HEALTH & PROJECT WARNING RADAR:
- A dedicated alert table highlighting "At-Risk Clients" (where `healthScore < 70` or projects have overdue milestones or unpaid invoices). Displays Client Name, Assigned Team Lead, Risk Factor, and quick "Send Check-in Email" button.
LIVE WEBSITE & MARKETING ANALYTICS (GA4 & GSC API Feed):
- Real-time agency website performance widget: Today's Unique Visitors, Top Landing Pages (`/services/*`), Contact Form conversion rate, and Organic Search Impression growth.
RECENT SYSTEM AUDIT STREAM:
- Live ticker of administrative actions and financial events from `AuditLog`: e.g., "Stripe webhook: Invoice INV-0089 paid ($4,500)", "Admin Sarah onboarded new client [Apex Corp]".
```

### 7.2 Clients Management & Onboarding Suite
* **Route**: `/admin/clients` & `/admin/clients/[id]`
* **Target Role**: `ADMIN`
* **Interconnection**: Full CRUD on `Client` and `User` models; triggers automated onboarding email workflows; links to all client projects, invoices, meetings, and reviews.

```text
[STITCH PROMPT: ADMIN CLIENTS MANAGEMENT SUITE]
Design an enterprise Client Relationship Management (CRM) & Onboarding Suite (`/admin/clients`).
CLIENT DIRECTORY TABLE (`/admin/clients`):
- Header Controls: Search by Company/Email, Filter by Industry, Filter by Health Score (Excellent > 90, Good 70-89, At-Risk < 70), and prominent "+ Onboard New Client" button.
- Comprehensive Data Grid:
  * Columns: Company Name (with logo avatar), Primary Contact Name & Email (`user.name`, `user.email`), Industry, Active Projects Count, Total Lifetime Revenue (`invoices` sum where paid), Health Score Bar (color-coded green/yellow/red), and Action Menu (View Profile, Edit, Impersonate Portal, Archive).
ONBOARDING NEW CLIENT MODAL / WIZARD (Triggered by "+ Onboard New Client"):
- Step 1: User Account Creation: Email, Name, Temporary Password (or auto-generate & send invite link via Resend).
- Step 2: Company Profile: Company Name, Industry, Phone, Initial Health Score (default 100).
- Step 3: Assign Initial Service / Project Template: Checkbox to immediately spin up an initial project from a `ProjectTemplate` (e.g., "SEO Retainer Onboarding") upon account creation!
CLIENT 360° PROFILE VIEW (`/admin/clients/[id]`):
- A master tabbed interface inspecting a single client:
  * [Overview & Notes]: Internal agency notes editor (`notes`), health score override slider, and company metadata.
  * [Assigned Projects]: List of all projects for this client with instant status toggle and budget progress.
  * [Financial History]: Complete ledger of all invoices, Stripe customer ID (`stripeId`), and payment speed metrics.
  * [Meeting & Call Logs]: History of all discovery and strategy meetings with staff notes.
  * [Review & CSAT Record]: All reviews submitted by this client.
```

### 7.3 Staff Directory & Role Permission Administration
* **Route**: `/admin/staff` & `/admin/staff/[id]`
* **Target Role**: `ADMIN`
* **Interconnection**: Full CRUD on `Staff` and `User` models; controls RBAC permission tiers (`TEAM_LEAD`, `SPECIALIST`, `CONTRACTOR`); monitors staff utilization rates and time logs.

```text
[STITCH PROMPT: ADMIN STAFF DIRECTORY & ROLES]
Design an authoritative Staff Management & Role Administration Center (`/admin/staff`).
STAFF DIRECTORY GRID & TABLE:
- Header Controls: Filter by Department, Filter by Staff Role (`TEAM_LEAD`, `SPECIALIST`, `CONTRACTOR`), Search by Skill Tag, and "+ Add Staff Member" CTA.
- Staff Cards / Table Rows:
  * Displays: Staff Avatar, Full Name, Email, Department, Staff Role Badge (with distinct styling: Team Lead = Purple Glow, Specialist = Cyan Badge, Contractor = Amber Badge), Skills Tag Cluster (`skills` array), Active Assigned Projects Count, and Weekly Logged Hours vs. Capacity.
STAFF MEMBER EDIT & PERMISSION DRAWER (`/admin/staff/[id]`):
- Account Information: Edit Name, Email, Department, and Active Status (`isActive` toggle — disabling immediately revokes portal access and invalidates refresh tokens!).
- ROLE & PERMISSION LEVEL SELECTOR:
  * Radio buttons with clear descriptions:
    - [ ] **Team Lead**: Can view all department projects, assign cards, edit client notes, and view project budgets.
    - [ ] **Specialist**: Can view assigned project cards, log time, move Kanban columns, and chat with clients.
    - [ ] **Contractor (Restricted Tier)**: Can ONLY view assigned cards and log time. **CRITICAL SECURITY RULE**: Enabling Contractor role automatically enforces server-side stripping of all billing, invoice, budget, and hourly rate data from API responses!
- CAPACITY & UTILIZATION ANALYTICS:
  * Charts showing this staff member's total logged hours over the past 6 months, breakdown of billable vs internal hours, and list of currently assigned Kanban cards across all projects.
```

### 7.4 Services Catalog & Rich Text Editor
* **Route**: `/admin/services` & `/admin/services/[slug]`
* **Target Role**: `ADMIN`
* **Interconnection**: Full CRUD on `Service` model; edits directly control what appears on Public Homepage, `/services`, Pricing Page, and Meeting Booking Wizard.

```text
[STITCH PROMPT: ADMIN SERVICES CATALOG EDITOR]
Design a state-of-the-art Services Catalog Management & Rich Text Editor (`/admin/services`).
SERVICES CATALOG LIST (`/admin/services`):
- Filter by Category (`CORE`, `SPECIALIZED`, `EMERGING`, `STRATEGY`) and Pricing Model (`RETAINER`, `PROJECT`, `PERFORMANCE`, `HOURLY`, `PACKAGE`).
- Table showing: Sort Order (`sortOrder` drag handle to reorder how services appear on public homepage!), Service Name, Slug, Category Badge, Pricing Model, Starting Price (`startingPrice`), Featured on Homepage toggle switch (`isFeatured`), Active status switch (`isActive`), and Edit button.
SERVICE CRUD EDITOR & WYSIWYG WORKSPACE (`/admin/services/[id]` or `/new`):
- 2-Column Split Editor Layout:
- LEFT COLUMN (Metadata & Configuration):
  * Service Name and URL Slug (auto-generated from name with manual override).
  * Category Dropdown and Pricing Model Selector.
  * Starting Price Decimal Input (e.g., `3500.00`) and Estimated Timeline input (e.g., "4-6 Weeks" or "Ongoing Retainer").
  * Icon Selector (Lucide/shadcn icon picker) and Cover Image / OG Image upload dropzone (`ogImage`).
  * SEO & Meta Tags Box: Meta Title, Meta Description, and Search Keywords array (`tags`).
- RIGHT COLUMN (Rich Text & Structure Builder):
  * Short Description text area (used in homepage cards).
  * Full Description WYSIWYG Editor (Tiptap integration supporting Headers, Bold, Bullet lists, Code blocks, and embedded images/tables) binding to `fullDescription`.
  * Dynamic Features List Builder (`features` JSON): Add/remove bullet points highlighting core technical advantages.
  * Deliverables Checklist Builder (`deliverables` JSON): Add/remove tangible client deliverables (e.g., "Weekly SEO Audit", "Dedicated Slack Channel").
- Bottom Action Bar: "Preview Service Page" (opens public layout in modal) + "Save & Publish Service" button.
```

### 7.5 Project & Kanban Template Builder
* **Route**: `/admin/projects` & `/admin/projects/templates`
* **Target Role**: `ADMIN`
* **Interconnection**: Full CRUD on `Project`, `ProjectTemplate`, `Column`, and `Milestone`. Templates seed new client projects with pre-configured Kanban structures and checklists.

```text
[STITCH PROMPT: ADMIN PROJECT & TEMPLATE BUILDER]
Design a powerful Project Administration & Kanban Template Builder (`/admin/projects`).
PROJECTS MASTER CONTROL TABLE (`/admin/projects`):
- Global view of all agency projects across all clients.
- Filters: Filter by Client Company, Filter by Status (`DRAFT`, `ACTIVE`, `ON_HOLD`, `REVIEW`, `COMPLETED`, `ARCHIVED`), Filter by Priority (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and Search by Title.
- Table Columns: Project Title, Client Name, Assigned Services (`services`), Team Leads / Roster, Start/End Date, Total Budget vs. Billable Hours Logged (`budget` vs `billableHours` * rate), Completion % progress bar, Status Badge, and Action Menu.
CREATE NEW PROJECT WIZARD (Triggered by "+ Create Project"):
- Step 1: Select Client (Dropdown of active clients or link to onboard new client).
- Step 2: Select Services & Template: Choose associated services from catalog and select an initial Kanban structure from `ProjectTemplate` dropdown (e.g., [SEO Retainer Template], [Website Build Template], [PPC Launch Template], or [Blank Board]).
- Step 3: Scope & Financials: Project Title, Budget Decimal, Priority, Start Date, and Target Completion Date.
- Step 4: Team Assignment: Multi-select dropdown to assign Team Leads and Specialists from `Staff` directory (`ProjectStaff`).
KANBAN TEMPLATE BUILDER (`/admin/projects/templates`):
- A dedicated visual workspace to create and edit reusable `ProjectTemplate` records!
- Allows Admin to name a template (e.g., "Enterprise E-Commerce Build") and visually build out default Kanban Columns (`columns` JSON: e.g., Backlog -> Wireframes -> Dev -> Client Review -> Launch) and default starter Cards with pre-populated checklists and instructions!
```

### 7.6 Financial Invoicing & Payment Administration
* **Route**: `/admin/invoices` & `/admin/invoices/[id]`
* **Target Role**: `ADMIN`
* **Interconnection**: Full CRUD on `Invoice` model; syncs with Stripe API for automated webhooks and payment status; supports manual payment overrides for bKash/Nagad regional wire transfers.

```text
[STITCH PROMPT: ADMIN FINANCIAL INVOICING SUITE]
Design an authoritative Financial Management & Invoicing Control Center (`/admin/invoices`).
FINANCIAL COMMAND HEADER:
- Revenue Metrics: Total Revenue YTD, Outstanding Receivables, Overdue Volume, and Monthly Recurring Billing Total.
- Filter Tabs: All Invoices | Drafts | Sent / Pending | Paid | Overdue | Recurring Schedules.
- "+ Create New Invoice" prominent primary CTA button.
INVOICE CREATION & EDITING WIZARD (`/admin/invoices/new` or `/[id]`):
- Client & Project Binding: Select Client from dropdown (auto-populates billing address/email) and optional Project reference.
- Issue Date and Due Date pickers (with quick buttons: Net 15, Net 30, Due on Receipt).
- DYNAMIC LINE ITEMS BUILDER (`lineItems` JSON):
  * Table with columns: Service / Item Description, Unit Price ($), Quantity / Hours, and Line Total ($).
  * "+ Add Line Item" button and quick-import button: "Import Unbilled Hours from Time Logs" (automatically pulls unbilled `TimeLog` entries for this project and populates hours!).
- Financial Calculations: Subtotal, Tax Rate (%) input, Discount ($ or %) input, and Total Decimal calculation (`total`).
- Recurring Retainer Toggle (`isRecurring`): Checkbox to automatically re-issue this invoice monthly/quarterly via Stripe recurring billing schedules!
- Action Buttons: "Save as Draft", "Send Invoice to Client via Email" (triggers Resend webhook + PDF generation + Stripe checkout link creation), and "Mark as Paid Manually".
MANUAL PAYMENT OVERRIDE MODAL (For bKash / Nagad / Wire Transfers):
- When Admin clicks "Mark as Paid Manually" on an unpaid invoice:
- Opens modal: Select Payment Method (Bank Transfer, bKash, Nagad, Check, Other), Enter Transaction Reference / TrxID string, Select Date Paid, and Optional Internal Financial Note. Clicking "Confirm Payment" updates `status == PAID`, records `paidAt` timestamp, and triggers payment receipt email to client!
```

### 7.7 Client Reviews Moderation Queue
* **Route**: `/admin/reviews/queue`
* **Target Role**: `ADMIN`
* **Interconnection**: Manages `Review` table; transitions status between `PENDING`, `APPROVED`, and `REJECTED`; writes official `adminReply`; approved reviews instantly syndicate to Public Homepage and Service pages.

```text
[STITCH PROMPT: ADMIN REVIEWS MODERATION QUEUE]
Design a clean, efficient Reviews Moderation & CSAT Management Queue (`/admin/reviews/queue`).
MODERATION COMMAND BAR:
- Tabs: Pending Approval (Badge count, e.g., "5 Pending") | Approved & Published | Rejected / Hidden | All Reviews.
- CSAT Metric Widget: Average Agency Rating (e.g., 4.9 / 5.0 Stars across 142 reviews) and Net Promoter Score (NPS) estimate.
REVIEW MODERATION CARDS GRID / LIST:
- Displays all `Review` records where `status == PENDING` by default.
- Card Layout:
  * Header: Client Company Name, Client Contact Name & Avatar, Date Submitted, and Associated Service / Project badge.
  * Rating Display: Star icons (1 to 5 glowing gold stars) + numerical rating.
  * Review Content Box: Full text of the client's submitted testimonial (`content`).
- MODERATION ACTION CONTROLS:
  * Admin Reply Box: Expandable rich text input allowing Admin to write an official public response (`adminReply`, e.g., "Thank you for the partnership! We loved engineering this scalable architecture for your team.").
  * Status Action Buttons:
    - [Approve & Publish to Website] (Green button — sets `status == APPROVED`, making it instantly live on public marketing pages!).
    - [Reject / Archive] (Red ghost button — sets `status == REJECTED`, hiding it from public view while preserving internal feedback).
    - [Request Clarification] (Triggers an email to client asking to expand on their feedback).
```

### 7.8 CMS Editor (Blog, Case Studies & Homepage Sections)
* **Route**: `/admin/cms`
* **Target Role**: `ADMIN`
* **Interconnection**: Full CRUD on `BlogPost`, `CaseStudy`, and dynamic homepage section content. Enables non-technical staff to update marketing copy and publish thought leadership without engineering deployments.

```text
[STITCH PROMPT: ADMIN CMS & CONTENT EDITOR]
Design an intuitive, content-focused CMS & Publication Studio (`/admin/cms`).
CMS MODULE SWITCHER TABS: [Blog & Insights] [Case Studies & Portfolio] [Homepage & Layout Copy].
TAB 1: BLOG & INSIGHTS EDITOR (`BlogPost` model):
- List of articles with status badges (Draft vs. Published), Publication Date (`publishedAt`), and View Count.
- Article Editor Workspace:
  * Title input and URL Slug generator (`slug`).
  * Cover Image upload dropzone (`coverImage`).
  * WYSIWYG / Markdown Content Editor (Tiptap integration with formatting toolbar, code block syntax highlighter, image embedding, and live split-screen markdown preview) binding to `content`.
  * Publish Controls: "Save Draft", "Schedule Publication Date", and "Publish Now" button.
TAB 2: CASE STUDIES EDITOR (`CaseStudy` model):
- Form builder for case studies: Title, Client Name, Industry tag, Primary Metric callout string (e.g., "+340% Organic Traffic"), Cover Image upload, and Rich Text detailed case study breakdown (`content`).
TAB 3: HOMEPAGE & LAYOUT COPY MANAGER (Dynamic Section Editor):
- A structured form interface allowing Admin to edit key marketing copy without touching code or redeploying:
  * Hero Section: Edit Main Headline, Sub-headline, and Primary CTA Button text/link.
  * Impact Stats Counter: Edit the 4 numerical stats displayed on the homepage (e.g., "$45M+", "99.8%", "150+").
  * Social Proof Ticker: Upload/remove client brand logo images.
```

### 7.9 System Security, Rate Limits & Audit Logs
* **Route**: `/admin/settings`
* **Target Role**: `ADMIN`
* **Interconnection**: Inspects `AuditLog` table; configures Upstash Redis rate limiting rules; manages global 2FA enforcement (`twoFactorEnabled`); monitors automated database backup health.

```text
[STITCH PROMPT: ADMIN SYSTEM SECURITY & AUDIT LOGS]
Design an authoritative System Security, Configuration & Audit Control Center (`/admin/settings`).
SETTINGS NAVIGATION TABS: [Live Audit Logs] [Security & 2FA Policies] [Rate Limiting & Redis Cache] [API Keys & Integrations] [Database Health].
TAB 1: LIVE AUDIT LOGS STREAM (`AuditLog` model):
- Real-time data table recording every critical system event across all roles.
- Filter Controls: Filter by User Role (`ADMIN`, `STAFF`, `CLIENT`), Filter by Action Type (e.g., `LOGIN`, `FAILED_LOGIN`, `PASSWORD_CHANGE`, `INVOICE_CREATED`, `ROLE_UPDATED`, `CARD_ARCHIVED`), Search by IP Address (`ip`), and Date Range picker.
- Table Columns: Timestamp (`createdAt`), Actor Name & Role Badge (`user.name`, `user.role`), Action Executed (`action`), IP Address, and Expandable Metadata JSON viewer (`metadata` showing exact payload changes, e.g., previous vs. new role).
TAB 2: SECURITY & 2FA POLICIES:
- Global 2FA Enforcement Toggle: "Require Two-Factor Authentication (TOTP) for all Staff and Admin accounts" (enabling this blocks login for staff without 2FA configured!).
- Session Timeout Configurator: Slider to set JWT access token expiration (default: 15 minutes) and Refresh Token rotation policy.
TAB 3: RATE LIMITING & REDIS CACHE (Upstash Integration):
- Live gauge showing Upstash Redis memory usage and hit/miss cache ratios.
- Rate Limit Configurator: Set API rate limit thresholds (e.g., `/api/auth/*` = 5 requests per 15 minutes per IP; `/api/public/*` = 60 requests per minute).
- Action Button: "Purge Global Redis Cache" (with confirmation danger modal).
TAB 4: API KEYS & EXTERNAL INTEGRATIONS:
- Status indicators and masked API key input fields for external services: Stripe Secret Key, Resend API Key, Pusher/Socket.io Credentials, Google Analytics 4 Property ID, and Cloudflare R2 / S3 Storage bucket credentials.
```

---

## 8. Webhooks & Background Processing Shells

### 8.1 Webhook Monitoring & Queue Management
* **Route**: `/admin/settings/webhooks` or Background Process Monitor
* **Target Role**: `ADMIN` (System Diagnostics)
* **Interconnection**: Documents incoming webhook endpoints (`POST /api/webhooks/stripe`, `POST /api/webhooks/calendar`) and cron queue execution (Vercel Cron / Upstash QStash).

```text
[STITCH PROMPT: WEBHOOKS & BACKGROUND QUEUE MONITOR]
Design a clean, developer-centric Webhook Diagnostics & Background Queue Monitor (`/admin/settings/webhooks`).
WEBHOOK ENDPOINTS HEALTH TABLE:
- Lists all active system webhook receptors:
  * `POST /api/webhooks/stripe`: Monitors invoice payment intents, subscription renewals, and charge failures. Status badge: "Connected & Listening (200 OK)".
  * `POST /api/webhooks/calendar`: Monitors calendar booking confirmations and rescheduling from external calendar providers.
- Table Columns: Endpoint URL, Event Type, Last Triggered Timestamp, HTTP Response Status Code (200 OK = Green, 4xx/5xx = Red Error), and "Test Webhook / Trigger Mock Event" button!
BACKGROUND CRON & QUEUE JOBS LIST (Vercel Cron / Upstash QStash):
- Displays scheduled automated background jobs:
  * `Daily Overdue Invoice Scanner`: Runs daily at 00:00 UTC. Checks `Invoice` table for unpaid invoices past `dueDate`, updates status to `OVERDUE`, and dispatches automated reminder emails via Resend.
  * `Weekly Client Health Score Calculator`: Runs every Sunday. Recalculates `Client.healthScore` based on communication frequency, payment speed, and milestone progress.
  * `Session Refresh Token Cleanup`: Runs daily to purge expired `Session` rows from PostgreSQL.
- Includes manual "Run Job Now" trigger buttons for instant administrative execution and testing.
```

---

## 9. Master Interconnection Flow Diagram

To visualize how all 34 prompts and pages connect across roles and data models, reference this master system flow when generating UI states in Stitch:

```
[PUBLIC MARKETING & ONBOARDING]
Homepage / Services / Pricing / Case Studies / Blog
       │
       ├─► (Click "Book Discovery Call") ─► /book-meeting (Intake Wizard)
       │                                          │
       │                                          ▼
       │                                   Creates `Meeting` (PENDING)
       │                                          │
       │                                          ▼
[ADMIN MANAGEMENT PORTAL] ◄───────────────────────┘ (Admin reviews call in `/admin/clients` or `/admin`)
  │    ├─► Converts Meeting to Client & Project ─► Creates `Client`, `User`, `Project`, `Kanban Columns/Cards`
  │    │                                                │
  │    ├─► Issues Retainer Invoice (`/admin/invoices`) ─► Creates `Invoice` (status: SENT)
  │    │                                                │
  │    └─► Assigns Team Leads & Specialists ────────────┼──────────────────────────┐
  │                                                     │                          │
  ▼                                                     ▼                          ▼
[CLIENT PORTAL] (`/client/*`)                         [STAFF WORKSPACE] (`/staff/*`)
  ├─► Overview (`/client`)                              ├─► Overview (`/staff`)
  ├─► Projects (`/client/projects`) ◄──(Real-time Sync)─┼─► Kanban Board (`/staff/projects/[id]`)
  ├─► Messages (`/client/messages`) ◄──(Socket Chat)────┼─► Chat & File Uploads
  ├─► Invoices (`/client/invoices`) ──(Stripe Pay)──►   ├─► Time Tracking (`/staff/time-logs`) ──► (Feeds Billable Hours)
  └─► Reviews (`/client/reviews`)   ──(Submit Review)─► └─► Meetings (`/staff/meetings`)
          │
          ▼
    Creates `Review` (PENDING)
          │
          ▼
[ADMIN REVIEW QUEUE] (`/admin/reviews/queue`) ──(Approve)──► Syndicates to Public Homepage & `/services/[slug]`
```

---

## 10. Summary Checklist for UI Engineers

When executing this prompt library in Stitch UI or your AI design tool of choice, verify the following quality gates before signing off on any generated page:
- [ ] **No Generic Placeholders**: Every generated page uses realistic agency data, proper currency formatting ($), and credible technical copy.
- [ ] **Dual-Theme Parity**: All frosted glass containers (`backdrop-blur`) maintain legibility across both Dark Mode (`bg-slate-900/80`) and Light Mode (`bg-white/80`).
- [ ] **Role-Based Stripping**: Contractor views in `/staff/*` strictly omit budget, billing, and rate fields.
- [ ] **Interactive States**: Buttons feature hover glows and active scale transformations; Kanban boards include visual drop indicators and priority badges.
- [ ] **Responsive Integrity**: Mobile layouts properly collapse sidebars into slide-out drawers and stack multi-column tables into clean scrollable cards.

---
*End of Nexus Agency Stitch UI Prompt Specification.*
