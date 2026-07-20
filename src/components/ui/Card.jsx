import { motion } from "framer-motion";

export function Card({ children, className = "", interactive = false }) {
  const Component = interactive ? motion.article : "article";
  const props = interactive ? { whileHover: { y: -3 }, transition: { duration: 0.18 } } : {};

  return (
    <Component className={`panel p-5 ${className}`} {...props}>
      {children}
    </Component>
  );
}

export function StatCard({ label, value, delta, icon: Icon }) {
  return (
    <Card interactive>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-500 dark:text-ink-400">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-normal text-ink-950 dark:text-white">{value}</p>
        </div>
        {Icon ? (
          <div className="rounded-md bg-brand-50 p-2 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
        ) : null}
      </div>
      <p className="mt-4 text-sm text-brand-700 dark:text-brand-200">{delta}</p>
    </Card>
  );
}
