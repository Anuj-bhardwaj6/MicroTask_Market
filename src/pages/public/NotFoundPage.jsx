import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";

export function NotFoundPage() {
  usePageTitle("Page not found");
  return (
    <main className="grid min-h-screen place-items-center bg-ink-50 px-4 text-center dark:bg-ink-950">
      <div>
        <p className="text-sm font-semibold text-brand-700 dark:text-brand-200">404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal">This page is off the board</h1>
        <p className="mt-3 text-ink-600 dark:text-ink-300">The route may have moved or the task was archived.</p>
        <Link to="/"><Button className="mt-6">Return home</Button></Link>
      </div>
    </main>
  );
}
