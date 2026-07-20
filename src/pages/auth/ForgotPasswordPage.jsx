import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { authService } from "../../api/services/authService.js";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  usePageTitle("Forgot password");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.forgotPassword({ email });
      navigate("/otp-verification", { state: { email, purpose: "reset-password" } });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-normal">Reset access</h1>
      <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">We will send a six-digit verification code to your email.</p>
      <form className="mt-8 space-y-5" onSubmit={submit}>
        <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
        {error ? <p className="rounded-md bg-coral-50 px-3 py-2 text-sm text-coral-700">{error}</p> : null}
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send verification code"}
        </Button>
      </form>
    </div>
  );
}
