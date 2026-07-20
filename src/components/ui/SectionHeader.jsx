export function SectionHeader({ eyebrow, title, action, children }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase text-brand-700 dark:text-brand-200">{eyebrow}</p> : null}
        <h2 className="mt-1 text-xl font-semibold tracking-normal text-ink-950 dark:text-white">{title}</h2>
        {children ? <p className="mt-2 max-w-2xl text-sm text-ink-600 dark:text-ink-300">{children}</p> : null}
      </div>
      {action}
    </div>
  );
}

