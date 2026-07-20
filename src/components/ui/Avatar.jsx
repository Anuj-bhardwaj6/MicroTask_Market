export function getInitials(name = "") {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "MT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Avatar({ src, name, size = "md", className = "" }) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-24 w-24 text-2xl",
  };
  const baseClass = `${sizes[size] || sizes.md} flex shrink-0 items-center justify-center rounded-full ring-1 ring-ink-200 dark:ring-ink-700 ${className}`;

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Profile"}
        className={`${baseClass} object-cover`}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`${baseClass} bg-ink-950 font-semibold tracking-normal text-white dark:bg-white dark:text-ink-950`} aria-label={name || "Profile"}>
      {getInitials(name)}
    </div>
  );
}