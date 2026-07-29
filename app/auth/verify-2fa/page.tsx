import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Verify 2fa" };

export default function AuthVerify2faPage() {
  return <RouteScaffold title="Verify 2fa" route="/auth/verify-2fa" />;
}
