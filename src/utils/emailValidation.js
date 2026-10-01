export const PUBLIC_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.in',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'gmx.com',
  'mail.com',
  'zoho.com'
]);

export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

export function extractDomain(email) {
  const normalized = normalizeEmail(email);
  const parts = normalized.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return parts[1];
}

export function isBusinessEmail(email) {
  const normalized = normalizeEmail(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    return false;
  }
  const domain = extractDomain(normalized);
  if (!domain) return false;
  
  if (PUBLIC_DOMAINS.has(domain)) {
    return false;
  }
  
  return true;
}
