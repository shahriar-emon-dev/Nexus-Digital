import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Auth routes each render their own split shell via `AuthShell`, because the
 * brand panel differs per step (registration promise, sign-in testimonials,
 * verification status). The layout only supplies shared providers.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
