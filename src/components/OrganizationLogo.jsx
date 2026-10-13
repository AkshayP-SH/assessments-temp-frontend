import { useEffect, useState } from 'react';
import shnoorLogo from '../assets/shnoor-logo.png';
import useTenantBranding from '../contexts/useTenantBranding';
import { getTenantLogoUrl } from '../utils/tenantBranding';

const OrganizationLogo = ({ className = '', alt = 'Organization logo' }) => {
  const { branding } = useTenantBranding();
  const logoUrl = getTenantLogoUrl(branding?.logoUrl);
  const [failedLogoUrl, setFailedLogoUrl] = useState(null);

  useEffect(() => {
    setFailedLogoUrl(null);
  }, [logoUrl]);

  const useFallback = !logoUrl || failedLogoUrl === logoUrl;

  return (
    <img
      src={useFallback ? shnoorLogo : logoUrl}
      alt={useFallback ? 'Shnoor logo' : alt}
      className={className}
      onError={() => {
        if (!useFallback) setFailedLogoUrl(logoUrl);
      }}
    />
  );
};

export default OrganizationLogo;
