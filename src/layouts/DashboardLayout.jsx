import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar.jsx";
import { Topbar } from "../components/layout/Topbar.jsx";
import { AuthLoadingScreen } from "../components/common/AuthLoadingScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { roleHome } from "../utils/routes.js";

const titles = {
  client: "Client Workspace",
  freelancer: "Freelancer Studio",
  admin: "Operations Console",
};

export function DashboardLayout({ role }) {
  const { user, isLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Wait for the persistent-login check (cookie -> /me, refreshing the
  // access token if needed) before deciding this route is unauthenticated.
  if (isLoading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={roleHome[user.role]} replace />;

  const segment = location.pathname.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ");
  const pageTitle = segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : titles[role];

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar role={role} open={open} setOpen={setOpen} />
      <div className="lg:pl-72">
        <Topbar title={pageTitle === "Dashboard" ? titles[role] : pageTitle} subtitle="Live operational view with role-specific workflows." />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
