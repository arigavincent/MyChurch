import branding from '../../shared/branding.json';

export const BRAND_NAME = branding.appName;
export const ADMIN_NAME = branding.adminName;

export function resolveChurchName(value) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || normalized === branding.legacyName) {
    return branding.appName;
  }
  return normalized;
}
