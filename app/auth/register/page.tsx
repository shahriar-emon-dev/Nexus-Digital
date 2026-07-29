import { RouteScaffold } from "@/components/shared/RouteScaffold";

export const metadata = { title: "Register" };

export default function AuthRegisterPage() {
  return <RouteScaffold title="Register" route="/auth/register" />;
}
