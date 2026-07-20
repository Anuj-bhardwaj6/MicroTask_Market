import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

export function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y rounded-lg border bg-white dark:bg-ink-900">
      {items.map((item, index) => (
        <div key={item.title}>
          <button
            type="button"
            onClick={() => setOpen(open === index ? -1 : index)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
          >
            {item.title}
            <FiChevronDown className={`h-4 w-4 transition ${open === index ? "rotate-180" : ""}`} />
          </button>
          {open === index ? <p className="px-4 pb-4 text-sm text-ink-600 dark:text-ink-300">{item.body}</p> : null}
        </div>
      ))}
    </div>
  );
}
