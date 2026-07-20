export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex rounded-md bg-ink-100 p-1 dark:bg-ink-800" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`flex-1 rounded px-3 py-2 text-sm font-semibold transition ${
            active === tab
              ? "bg-white text-ink-950 shadow-sm dark:bg-ink-950 dark:text-white"
              : "text-ink-600 hover:text-ink-950 dark:text-ink-300 dark:hover:text-white"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
