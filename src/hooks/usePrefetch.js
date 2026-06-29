import { useCallback } from 'react';

/**
 * usePrefetch — imperatively prefetches a lazy-loaded route chunk on hover.
 *
 * Usage:
 *   const prefetchLogin = usePrefetch(() => import('../components/Login'));
 *   <button onMouseEnter={prefetchLogin}>Sign In</button>
 *
 * The dynamic import is a no-op if the chunk is already cached by the browser.
 */
export function usePrefetch(importFn) {
  return useCallback(() => {
    try {
      importFn();
    } catch {
      // Prefetch failures are non-critical — swallow silently
    }
  }, [importFn]);
}

export default usePrefetch;
