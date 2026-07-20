import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { roleHome } from "../../utils/routes.js";

const demoCredentials = {
  client: { email: "maya@northstar.co", password: "password123" },
  freelancer: { email: "adrian@studio.io", password: "password123" },
  admin: { email: "nora@microtask.com", password: "password123" },
};

export function AuthForm({ mode }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("client");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";
  const isLogin = mode === "login";
  const currentDemo = demoCredentials[role];

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (isRegister && !name.trim()) {
      setError("Enter your full name.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegister) {
        const user = await register({ name: name.trim(), email, password, role });
        // New accounts start unverified - collect the emailed OTP before
        // dropping the person into their dashboard.
        navigate("/otp-verification", {
          state: { email: user.email, purpose: "verify-email" },
        });
      } else {
        const user = await login({ email, password });
        navigate(roleHome[user.role]);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueWithGoogle = () => {
    setError("Google login is not connected yet. Add a Google OAuth Client ID and backend/session flow before enabling one-click Google access.");
  };

  const fillDemoCredentials = () => {
    setEmail(currentDemo.email);
    setPassword(currentDemo.password);
    setConfirmPassword(currentDemo.password);
    setError("");
  };

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-normal">{isRegister ? "Create your workspace" : "Welcome back"}</h1>
      <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">
        {isRegister ? "Set up a client, freelancer, or admin account." : "Choose a role and sign in with your account."}
      </p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        {isRegister ? (
          <Input label="Full name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jane Doe" required />
        ) : null}
        <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
        <label className="block">
          <span className="mb-2 block text-sm font-medium">Password</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11 w-full rounded-md border bg-white px-3 pr-11 text-sm dark:bg-ink-900"
              placeholder="Minimum 8 characters"
              required
              minLength={8}
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Show password">
              {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          </div>
        </label>
        {isRegister ? (
          <Input
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat password"
            required
            minLength={8}
          />
        ) : null}
        <div>
          <span className="mb-2 block text-sm font-medium">Role selection</span>
          <div className="grid grid-cols-3 gap-2">
            {["client", "freelancer", "admin"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setRole(item);
                  setError("");
                }}
                className={`rounded-md border px-3 py-2 text-sm font-semibold capitalize transition ${
                  role === item ? "border-ink-950 bg-ink-950 text-white dark:border-white dark:bg-white dark:text-ink-950" : "hover:bg-ink-50 dark:hover:bg-ink-800"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        {isLogin ? (
          <div className="rounded-md border bg-ink-50 p-3 text-sm text-ink-600 dark:bg-ink-900 dark:text-ink-300">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Demo credentials: <strong>{currentDemo.email}</strong> / <strong>{currentDemo.password}</strong>
              </span>
              <button type="button" onClick={fillDemoCredentials} className="font-semibold text-brand-700 dark:text-brand-200">
                Fill demo
              </button>
            </div>
          </div>
        ) : null}
        {isLogin ? (
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-ink-300" defaultChecked />
              Remember me
            </label>
            <Link to="/forgot-password" className="font-semibold text-brand-700 dark:text-brand-200">Forgot password?</Link>
          </div>
        ) : null}
        {error ? <p className="rounded-md bg-coral-50 px-3 py-2 text-sm text-coral-700">{error}</p> : null}
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Please wait…" : isRegister ? "Create account" : "Log in"}
        </Button>
        <Button className="w-full" variant="secondary" type="button" icon={FcGoogle} onClick={continueWithGoogle} disabled={isSubmitting}>
          Continue with Google
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-600 dark:text-ink-300">
        {isRegister ? "Already have an account?" : "New to MicroTask Market?"}{" "}
        <Link className="font-semibold text-brand-700 dark:text-brand-200" to={isRegister ? "/login" : "/register"}>
          {isRegister ? "Log in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}
