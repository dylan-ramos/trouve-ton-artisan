import { useEffect } from 'react';

import { getPublicUrl } from '../services/site-url';

interface SeoProps {
  title: string;
  description: string;
  canonicalPath?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
}

function upsertMeta(selector: string, attribute: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    const [name, content] = attribute.split('=');
    if (name && content) element.setAttribute(name, content);
    document.head.append(element);
  }
  element.setAttribute('content', value);
}

export function Seo({
  title,
  description,
  canonicalPath = '/',
  noIndex = false,
  structuredData,
}: SeoProps) {
  useEffect(() => {
    const canonicalUrl = getPublicUrl(canonicalPath);
    document.title = title;
    upsertMeta('meta[name="description"]', 'name=description', description);
    upsertMeta(
      'meta[name="robots"]',
      'name=robots',
      noIndex ? 'noindex, follow' : 'index, follow',
    );
    upsertMeta('meta[property="og:title"]', 'property=og:title', title);
    upsertMeta(
      'meta[property="og:description"]',
      'property=og:description',
      description,
    );
    upsertMeta('meta[property="og:url"]', 'property=og:url', canonicalUrl);
    upsertMeta('meta[property="og:type"]', 'property=og:type', 'website');
    upsertMeta('meta[name="twitter:card"]', 'name=twitter:card', 'summary');

    let canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = canonicalUrl;

    const previousJsonLd = document.head.querySelector(
      'script[data-seo-json-ld]',
    );
    previousJsonLd?.remove();
    if (structuredData) {
      const jsonLd = document.createElement('script');
      jsonLd.type = 'application/ld+json';
      jsonLd.dataset.seoJsonLd = '';
      jsonLd.textContent = JSON.stringify(structuredData).replaceAll(
        '<',
        '\\u003c',
      );
      document.head.append(jsonLd);
    }

    return () => {
      document.head.querySelector('script[data-seo-json-ld]')?.remove();
    };
  }, [canonicalPath, description, noIndex, structuredData, title]);

  return null;
}
