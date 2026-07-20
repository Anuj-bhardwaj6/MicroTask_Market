import { FiInbox } from "react-icons/fi";
import { Button } from "../ui/Button.jsx";

export function EmptyState({ title = "Nothing here yet", message, action }) {
  return (
    <div className="panel flex min-h-64 flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 rounded-md bg-ink-100 p-3 text-ink-600 dark:bg-ink-800 dark:text-ink-200">
        <FiInbox className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-ink-600 dark:text-ink-300">{message}</p>
      {action ? <Button className="mt-5">{action}</Button> : null}
    </div>
  );
}
