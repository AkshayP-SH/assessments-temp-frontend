import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import TenantBrandingContext from './TenantBrandingContext';
import { apiFetch } from '../config/api';

export const TenantBrandingProvider = ({ children }) => {
  const location = useLocation();
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateBranding = useCallback((nextBranding) => {
    setBranding((current) => ({ ...current, ...nextBranding }));
  }, []);

  useEffect(() => {
    let adminUser = null;
    try {
      adminUser = JSON.parse(localStorage.getItem('adminUser') || 'null');
    } catch {
      adminUser = null;
    }

    const clientToken = adminUser?.role === 'client_admin'
      ? localStorage.getItem('clientToken')
      : null;
    const studentToken = /^\/(dashboard|instructions|test|result|feedback|job-board|student|interview-room)(\/|$)/.test(location.pathname)
      ? localStorage.getItem('studentAuthToken')
      : null;
    const token = clientToken || studentToken;

    if (!token) {
      setBranding(null);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);

    apiFetch('api/client/auth/branding', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      skipGlobalErrorRedirect: true,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to load organization logo');
        }
        setBranding(data.branding || null);
      })
      .catch((error) => {
        if (!['AbortError', 'CanceledError'].includes(error.name)) {
          console.error('Failed to load organization branding:', error);
          setBranding(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [location.pathname]);

  return (
    <TenantBrandingContext.Provider value={{ branding, loading, updateBranding }}>
      {children}
    </TenantBrandingContext.Provider>
  );
};

export default TenantBrandingProvider;
