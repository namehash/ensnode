import { useState } from "react";
import { useIsomorphicEffect } from "rooks";

/**
 * Simple hook to determine whether the client is finished hydrating, to avoid hydration mis-matches
 * in client components.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useIsomorphicEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
