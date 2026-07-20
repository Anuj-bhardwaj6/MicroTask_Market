import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { authService } from "../../api/services/authService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { roleHome } from "../../utils/routes.js";

export function OtpVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUser } = useAuth();
  usePageTitle("OTP verification");

  const email = location.state?.email || "";
  const purpose = location.state?.purpose || "verify-email";
  const isReset = purpose === "reset-password";

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const inputsRef = useRef([]);

  const handleDigitChange = (index, value) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (clean && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    setDigits((prev) => {
      const next = [...prev];
      pasted.split("").forEach((char, i) => {
        next[i] = char;
      });
      return next;
    });
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    const otp = digits.join("");
    if (!email) {
      setError("Missing email - please restart this flow.");
      return;
    }
    if (otp.length !== 6) {
      setError("Enter the full 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.verifyOtp({ email, otp, purpose });
      if (isReset) {
        navigate("/reset-password", { state: { token: res.data.resetToken, email } });
      } else {
        updateUser({ isVerified: true });
        const role = res.data.user?.role;
        navigate(role ? roleHome[role] : "/login");
      }
    } catch (err) {
      setError(err.message || "That code did not work. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    setError("");
    setResendMessage("");
    if (!email) {
      setError("Missing email - please restart this flow.");
      return;
    }
    setIsResending(true);
    try {
      await authService.sendOtp({ email, purpose });
      setResendMessage("A new code is on its way.");
    } catch (err) {
      setError(err.message || "Could not resend the code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-normal">Verify your code</h1>
      <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
        {isReset ? "Enter the code sent to your inbox to continue resetting your password." : "Enter the code sent to your inbox to verify your email."} It expires in 10 minutes.
      </p>
      <form className="mt-8 space-y-5" onSubmit={submit}>
        <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
          {digits.map((digit, item) => (
            <input
              key={item}
              ref={(el) => (inputsRef.current[item] = el)}
              value={digit}
              onChange={(event) => handleDigitChange(item, event.target.value)}
              onKeyDown={(event) => handleKeyDown(item, event)}
              inputMode="numeric"
              maxLength={1}
              className="h-12 rounded-md border bg-white text-center text-lg font-semibold dark:bg-ink-900"
              aria-label={`Digit ${item + 1}`}
            />
          ))}
        </div>
        {error ? <p className="rounded-md bg-coral-50 px-3 py-2 text-sm text-coral-700">{error}</p> : null}
        {resendMessage ? <p className="rounded-md bg-ink-50 px-3 py-2 text-sm text-ink-600 dark:bg-ink-900 dark:text-ink-300">{resendMessage}</p> : null}
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Verifying…" : "Verify code"}
        </Button>
        <button
          type="button"
          onClick={resendCode}
          disabled={isResending}
          className="w-full text-center text-sm font-semibold text-brand-700 dark:text-brand-200"
        >
          {isResending ? "Resending…" : "Resend code"}
        </button>
      </form>
    </div>
  );
}
