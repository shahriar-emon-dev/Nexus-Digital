import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
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
  title: {
    default: "Nexus Digital Agency — Full-Stack Role-Based Platform",
    template: "%s · Nexus",
  },
  description:
    "Production-grade digital marketing agency platform featuring role-gated dashboards for Admin, Staff, and Clients.",
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
