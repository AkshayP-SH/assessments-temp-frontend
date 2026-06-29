import { useEffect } from 'react';

/**
 * useSEO — dynamically sets page title, meta description, and Open Graph tags.
 *
 * Usage:
 *   useSEO({
 *     title: 'Sign In - SHNOOR Assessments',
 *     description: 'Sign in to access your assigned assessments.',
 *     canonical: 'https://assessments.shnoor.com/login', // optional
 *     ogImage: 'https://assessments.shnoor.com/og-image.png', // optional
 *   });
 *
 * This is a lightweight alternative to react-helmet — no extra dependency needed.
 */
export const useSEO = ({ title, description, canonical, ogImage } = {}) => {
  useEffect(() => {
    // --- Title ---
    if (title) {
      document.title = title;
    }

    // Helper to upsert a <meta> tag by attribute selector
    const setMeta = (selector, value) => {
      if (!value) return;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        // Parse attribute name/value from selector like [name="description"]
        const match = selector.match(/\[([^=]+)="([^"]+)"\]/);
        if (match) {
          el.setAttribute(match[1], match[2]);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

    // Helper to upsert a <link> tag
    const setLink = (rel, href) => {
      if (!href) return;
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    // --- Standard meta ---
    setMeta('[name="description"]', description);

    // --- Open Graph ---
    setMeta('[property="og:title"]', title);
    setMeta('[property="og:description"]', description);
    if (canonical) {
      setMeta('[property="og:url"]', canonical);
    }
    if (ogImage) {
      setMeta('[property="og:image"]', ogImage);
      setMeta('[property="og:image:width"]', '1200');
      setMeta('[property="og:image:height"]', '630');
    }

    // --- Twitter Card ---
    setMeta('[name="twitter:title"]', title);
    setMeta('[name="twitter:description"]', description);
    if (ogImage) {
      setMeta('[name="twitter:image"]', ogImage);
    }

    // --- Canonical link ---
    setLink('canonical', canonical);
  }, [title, description, canonical, ogImage]);
};

export default useSEO;
