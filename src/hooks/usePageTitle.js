import { useEffect } from "react";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title} | MicroTask Market`;
  }, [title]);
}
