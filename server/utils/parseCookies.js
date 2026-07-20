// Parses a raw `Cookie` header string into a plain object. Deliberately
// dependency-free (no `cookie` package import) so it works regardless of
// what gets hoisted in node_modules.
export function parseCookieHeader(header) {
  const out = {};
  if (!header) return out;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    if (!key) return;
    const value = pair.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  });
  return out;
}

export default parseCookieHeader;
