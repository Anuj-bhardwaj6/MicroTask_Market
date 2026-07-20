export function Input({ label, helper, className = "", ...props }) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-sm font-medium text-ink-800 dark:text-ink-100">{label}</span> : null}
      <input
        className={`min-h-11 w-full rounded-md border bg-white px-3 text-sm text-ink-950 transition placeholder:text-ink-400 hover:border-ink-300 dark:bg-ink-900 dark:text-white ${className}`}
        {...props}
      />
      {helper ? <span className="mt-1 block text-xs text-ink-500 dark:text-ink-400">{helper}</span> : null}
    </label>
  );
}

export function Textarea({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-sm font-medium text-ink-800 dark:text-ink-100">{label}</span> : null}
      <textarea
        className={`min-h-32 w-full rounded-md border bg-white px-3 py-3 text-sm text-ink-950 transition placeholder:text-ink-400 dark:bg-ink-900 dark:text-white ${className}`}
        {...props}
      />
    </label>
  );
}

export function Select({ label, children, className = "", ...props }) {
  return (
    <label className="block">
      {label ? <span className="mb-2 block text-sm font-medium text-ink-800 dark:text-ink-100">{label}</span> : null}
      <select
        className={`min-h-11 w-full rounded-md border bg-white px-3 text-sm text-ink-950 dark:bg-ink-900 dark:text-white ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
