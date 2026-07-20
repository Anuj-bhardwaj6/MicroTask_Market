import { AuthForm } from "./AuthForm.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";

export function RegisterPage() {
  usePageTitle("Register");
  return <AuthForm mode="register" />;
}
