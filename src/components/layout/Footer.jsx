export function Footer() {
  return (
    <footer className="border-t bg-white py-8 dark:bg-ink-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>MicroTask Market connects urgent work with vetted independent specialists.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-ink-950 dark:hover:text-white">Security</a>
          <a href="#" className="hover:text-ink-950 dark:hover:text-white">Terms</a>
          <a href="#" className="hover:text-ink-950 dark:hover:text-white">Support</a>
        </div>
      </div>
    </footer>
  );
}
