import { useContext } from 'react';
import TenantBrandingContext from './TenantBrandingContext';

const useTenantBranding = () => {
  const context = useContext(TenantBrandingContext);
  if (!context) {
    throw new Error('useTenantBranding must be used within a TenantBrandingProvider');
  }
  return context;
};

export default useTenantBranding;
