import { Link, NavLink } from "react-router-dom";
import { FiMoon, FiSun } from "react-icons/fi";
import { Button } from "../ui/Button.jsx";
import { Logo } from "./Logo.jsx";
import { useTheme } from "../../context/ThemeContext.jsx";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur dark:bg-ink-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-600 dark:text-ink-300 md:flex">
          {["How it works", "Talent", "Pricing"].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} className="hover:text-ink-950 dark:hover:text-white">
              {item}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-md border p-2 text-ink-700 hover:bg-ink-50 dark:text-ink-100 dark:hover:bg-ink-800"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
          </button>
          <NavLink to="/login" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800 sm:inline-flex">
            Log in
          </NavLink>
          <Link to="/register">
            <Button>Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

