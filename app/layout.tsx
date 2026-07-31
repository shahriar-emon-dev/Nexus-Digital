import type { Metadata, Viewport } from "next";

import { siteUrl } from "@/lib/site";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider, ToastViewport } from "@/components/ui/toast";

// `optional`, not `swap`. At display sizes a metric difference between the
// fallback and the real face flips a wrap point, and the heading gains or loses
// a whole 57.6px line when the swap lands — measured as 0.140 CLS on /client,
// above Google's 0.1 threshold. `optional` renders the fallback for the whole
// load rather than reflowing mid-paint. Body text keeps `swap`, where the
// size-adjusted fallback is close enough not to move layout.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "optional",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  // Without metadataBase, Next cannot resolve relative OG/canonical URLs and
  // silently drops them — which is why no share card was being emitted.
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nexus Digital Agency — Full-Stack Role-Based Platform",
    template: "%s · Nexus",
  },
  description:
    "Production-grade digital marketing agency platform featuring role-gated dashboards for Admin, Staff, and Clients.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Nexus Digital Agency",
    url: "/",
    title: "Nexus Digital Agency — Engineering the Future of Brand",
    description:
      "We design and build the digital systems behind ambitious brands — commerce, content and measurement, engineered end to end.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus Digital Agency",
    description:
      "We design and build the digital systems behind ambitious brands.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1513" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(spaceGrotesk.variable, inter.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-svh bg-canvas text-ink antialiased">
        <ThemeProvider>
          {/* The toast primitives existed but were never provided, so any
              `useToast` consumer would have thrown. Mounted once at the root so
              every surface can raise feedback. */}
          <ToastProvider>
            {children}
            <ToastViewport />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
