export function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-300 border-t-ink-950 dark:border-ink-700 dark:border-t-white" />
        <p className="text-sm text-ink-500 dark:text-ink-400">Loading your session…</p>
      </div>
    </div>
  );
}
