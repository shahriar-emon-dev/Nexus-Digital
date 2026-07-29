import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Forgot Password" };

export default function AuthForgotPasswordPage() {
  return <RouteScaffold title="Forgot Password" route="/auth/forgot-password" />;
}
