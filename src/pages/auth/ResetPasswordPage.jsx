import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { authService } from "../../api/services/authService.js";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  usePageTitle("Reset password");

  const token = location.state?.token || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is no longer valid. Please start over.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword({ token, password });
      navigate("/login");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-normal">Create a new password</h1>
      <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">Use a strong password that you do not use on another service.</p>
      <form className="mt-8 space-y-5" onSubmit={submit}>
        <Input label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
        <Input label="Confirm password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required />
        {error ? <p className="rounded-md bg-coral-50 px-3 py-2 text-sm text-coral-700">{error}</p> : null}
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save password"}
        </Button>
      </form>
    </div>
  );
}
