import { useCallback } from 'react';

export function usePrefetch(importFn) {
  return useCallback(() => {
    try {
      const res = importFn();
      if (res && typeof res.catch === 'function') {
        res.catch(() => undefined);
      }
    } catch {
      return undefined;
    }
  }, [importFn]);
}

export default usePrefetch;
