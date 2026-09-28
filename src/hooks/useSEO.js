import { useEffect } from 'react';

export const useSEO = ({ title, description, canonical, ogImage } = {}) => {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    const setMeta = (selector, value) => {
      if (!value) return;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const match = selector.match(/\[([^=]+)="([^"]+)"\]/);
        if (match) {
          el.setAttribute(match[1], match[2]);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', value);
    };

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

    setMeta('[name="description"]', description);

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

    setMeta('[name="twitter:title"]', title);
    setMeta('[name="twitter:description"]', description);
    if (ogImage) {
      setMeta('[name="twitter:image"]', ogImage);
    }

    setLink('canonical', canonical);
  }, [title, description, canonical, ogImage]);
};

export default useSEO;
