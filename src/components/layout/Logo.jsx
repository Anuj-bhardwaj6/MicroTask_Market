import { Link } from "react-router-dom";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label="MicroTask Market home">
      <span className="grid h-9 w-9 place-items-center rounded-md bg-ink-950 text-sm font-bold text-white dark:bg-white dark:text-ink-950">
        MT
      </span>
      <span className="text-sm font-bold tracking-normal text-ink-950 dark:text-white">MicroTask Market</span>
    </Link>
  );
}
