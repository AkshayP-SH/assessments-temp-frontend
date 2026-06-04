/**
 * useBranding
 * Fetches and applies per-tenant branding (logo, colors) for the current client.
 *
 * Usage:
 *   const { branding, loading } = useBranding();
 *
 * Auto-resolves clientId from:
 *   1. URL query param  ?clientId=4
 *   2. localStorage     adminUser.clientId  (client admin session)
 *   3. localStorage     clientUser.clientId (legacy client session)
 */

import { useState, useEffect } from 'react';
import { apiFetch } from '../config/api';

export function useBranding() {
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let clientId = null;

    // 1. URL query param
    const params = new URLSearchParams(window.location.search);
    if (params.get('clientId')) {
      clientId = params.get('clientId');
    }

    // 2. Logged-in admin/client session
    if (!clientId) {
      try {
        const u = JSON.parse(localStorage.getItem('adminUser') || '{}');
        if (u.clientId) clientId = u.clientId;
      } catch { /* ignore */ }
    }

    if (!clientId) {
      try {
        const u = JSON.parse(localStorage.getItem('clientUser') || '{}');
        if (u.clientId) clientId = u.clientId;
      } catch { /* ignore */ }
    }

    if (!clientId) return;

    setLoading(true);
    apiFetch(`api/client/auth/branding?clientId=${clientId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.branding) {
          const b = data.branding;
          setBranding(b);
          // Apply CSS variables for brand colors
          if (b.primaryColor) {
            document.documentElement.style.setProperty('--brand-primary', b.primaryColor);
          }
          if (b.accentColor) {
            document.documentElement.style.setProperty('--brand-accent', b.accentColor);
          }
        }
      })
      .catch(() => { /* non-critical */ })
      .finally(() => setLoading(false));
  }, []);

  return { branding, loading };
}
