export function SkeletonLoader() {
  return (
    <div className="space-y-3" aria-label="Loading content">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-14 animate-pulse rounded-md bg-ink-100 dark:bg-ink-800" />
      ))}
    </div>
  );
}
