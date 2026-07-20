import { motion } from "framer-motion";

const variants = {
  primary: "bg-ink-950 text-white hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100",
  secondary: "border bg-white text-ink-900 hover:bg-ink-50 dark:bg-ink-900 dark:text-ink-50 dark:hover:bg-ink-800",
  accent: "bg-brand-600 text-white hover:bg-brand-700",
  ghost: "text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800",
  danger: "bg-coral-500 text-white hover:bg-coral-700",
};

export function Button({ children, variant = "primary", className = "", icon: Icon, ...props }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </motion.button>
  );
}
