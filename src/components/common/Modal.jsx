import { motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import { Button } from "../ui/Button.jsx";

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/50 p-4" role="dialog" aria-modal="true">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-lg bg-white p-5 shadow-soft dark:bg-ink-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" className="h-9 w-9 px-0" onClick={onClose} aria-label="Close modal">
            <FiX className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
