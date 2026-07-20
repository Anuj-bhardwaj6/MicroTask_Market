const toneClasses = {
  green: "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-100",
  amber: "bg-amberx-50 text-amberx-600 dark:bg-amberx-500/15 dark:text-amberx-200",
  red: "bg-coral-50 text-coral-700 dark:bg-coral-500/15 dark:text-coral-100",
  neutral: "bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-200",
};

export function Badge({ children, tone = "neutral" }) {
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${toneClasses[tone]}`}>{children}</span>;
}
