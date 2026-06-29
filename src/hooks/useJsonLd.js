import { useEffect } from 'react';

/**
 * useJsonLd — injects a JSON-LD <script> tag into <head> for structured data.
 *
 * Usage:
 *   useJsonLd({
 *     "@context": "https://schema.org",
 *     "@type": "Organization",
 *     "name": "SHNOOR Assessments",
 *     "url": "https://assessments.shnoor.com"
 *   });
 */
export function useJsonLd(schema) {
  useEffect(() => {
    if (!schema) return;

    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('id', 'json-ld-schema');
    script.textContent = JSON.stringify(schema);

    // Remove any existing JSON-LD tag before adding new one
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
