import { useEffect } from 'react';

export function useJsonLd(schema) {
  useEffect(() => {
    if (!schema) return;

    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('id', 'json-ld-schema');
    script.textContent = JSON.stringify(schema);

    const existing = document.getElementById('json-ld-schema');
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('json-ld-schema');
      if (el) el.remove();
    };
  }, [JSON.stringify(schema)]); // eslint-disable-line react-hooks/exhaustive-deps
}

export default useJsonLd;
