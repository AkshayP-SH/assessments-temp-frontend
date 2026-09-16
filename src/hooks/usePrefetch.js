import { useCallback } from 'react';

export function usePrefetch(importFn) {
  return useCallback(() => {
    try {
      importFn();
    } catch {
      return undefined;
    }
  }, [importFn]);
}

export default usePrefetch;
