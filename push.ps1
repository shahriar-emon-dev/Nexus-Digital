$commitMessage = @"
feat: complete initial project structure and core features

This commit includes the foundational setup and core feature implementation for the Nexus Digital Agency platform.

Features & Modules:
- Public Pages: About, Blog, Book Meeting, Case Studies, Contact, Pricing, Reviews, and Services pages.
- Authentication: Integrated next-auth for secure login/registration workflows.
- Portals: Added dedicated layouts and pages for Admin, Client, and Staff portals.
- API Layer: Created Next.js API routes for handling backend logic.
- Database: Integrated Prisma ORM with initial schema setup.

UI & Components:
- Theming: Added a theme-provider for light/dark mode support.
- Core UI: Reusable base UI components utilizing Tailwind CSS and Radix UI.
- Marketing UI: Dedicated marketing components for landing pages.
- Animations: Integrated framer-motion (motion) and tw-animate-css for fluid UI animations.
- Layouts: Shared navigation, headers, footers, and portal-specific layouts.

Tech Stack & Configuration:
- Next.js 14 App Router, TypeScript, and Tailwind CSS v4.
- Upstash Redis & Ratelimit for performance and security.
- ESLint, Prettier, and Playwright for code quality and testing.
"@

git init
git add .
git commit -m $commitMessage
git branch -M main
git remote remove origin 2>$null
git remote add origin https://github.com/shahriar-emon-dev/Nexus-Digital.git
git push -u origin main
