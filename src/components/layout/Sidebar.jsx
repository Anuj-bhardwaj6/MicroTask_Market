import { NavLink } from "react-router-dom";
import { FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { navByRole } from "../../utils/routes.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { Logo } from "./Logo.jsx";
import { Avatar } from "../ui/Avatar.jsx";

export function Sidebar({ role, open, setOpen }) {
  const { user, logout } = useAuth();
  const items = navByRole[role] || [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-md border bg-white p-2 shadow-soft lg:hidden dark:bg-ink-900"
        aria-label="Open navigation"
      >
        <FiMenu className="h-5 w-5" />
      </button>
      {open ? <div className="fixed inset-0 z-40 bg-ink-950/40 lg:hidden" onClick={() => setOpen(false)} /> : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-white p-4 transition-transform dark:bg-ink-950 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <button className="rounded-md p-2 hover:bg-ink-100 lg:hidden dark:hover:bg-ink-800" onClick={() => setOpen(false)} aria-label="Close navigation">
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950"
                      : "text-ink-600 hover:bg-ink-100 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white"
                  }`
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-5 rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatar} name={user?.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs capitalize text-ink-500">{role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <FiLogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
