import { API_URL } from '../config/api';

export const getTenantLogoUrl = (logoUrl) => {
  if (!logoUrl) return null;
  if (/^https?:\/\//i.test(logoUrl)) return logoUrl;
  return `${API_URL.replace(/\/$/, '')}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
};
