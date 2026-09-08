const siteUrl = (
  import.meta.env.VITE_SITE_URL ?? window.location.origin
).replace(/\/$/, '');

export function getPublicUrl(path = '/') {
  return new URL(path, `${siteUrl}/`).href;
}
