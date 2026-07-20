import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Logo } from "../components/layout/Logo.jsx";
import { AuthLoadingScreen } from "../components/common/AuthLoadingScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { roleHome } from "../utils/routes.js";

// Registration signs the user in right away (pending email verification), so
// /otp-verification and /reset-password have to stay reachable even though a
// session already exists. Only /login and /register are true "guest only" pages.
const GUEST_ONLY_PATHS = new Set(["/login", "/register"]);

export function AuthLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Wait for the persistent-login check to resolve before deciding whether
  // this is a guest - otherwise a logged-in user briefly sees the login
  // form again on every page refresh.
  if (isLoading) return <AuthLoadingScreen />;
  if (user && GUEST_ONLY_PATHS.has(location.pathname)) {
    return <Navigate to={roleHome[user.role]} replace />;
  }

  return (
    <main className="grid min-h-screen bg-ink-50 dark:bg-ink-950 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex min-h-screen flex-col justify-between px-4 py-6 sm:px-8">
        <Logo />
        <div className="mx-auto w-full max-w-md py-10">
          <Outlet />
        </div>
        <p className="text-sm text-ink-500">Secure authentication for clients, freelancers, and operations teams.</p>
      </section>
      <aside className="hidden overflow-hidden border-l bg-ink-950 text-white lg:block">
        <div className="flex h-full flex-col justify-between p-10">
          <div>
            <p className="text-sm font-semibold text-brand-200">Trusted work, fast handoffs</p>
            <h2 className="mt-4 max-w-md text-4xl font-semibold tracking-normal">
              Route every micro task to the right specialist before momentum cools.
            </h2>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=320&q=80"
                alt="Team reviewing marketplace work"
                className="h-16 w-16 rounded-md object-cover"
              />
              <div>
                <p className="font-semibold">42 min average task fill time</p>
                <p className="mt-1 text-sm text-ink-300">Live matching, escrow, chat, and review workflows in one place.</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}

