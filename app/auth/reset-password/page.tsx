import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Reset Password" };

export default function AuthResetPasswordPage() {
  return <RouteScaffold title="Reset Password" route="/auth/reset-password" />;
}
