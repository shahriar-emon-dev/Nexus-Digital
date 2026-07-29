import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Login" };

export default function AuthLoginPage() {
  return <RouteScaffold title="Login" route="/auth/login" />;
}
