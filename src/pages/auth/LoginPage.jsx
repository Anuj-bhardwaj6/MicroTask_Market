import { AuthForm } from "./AuthForm.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";

export function LoginPage() {
  usePageTitle("Log in");
  return <AuthForm mode="login" />;
}
