import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
}

export function Seo({ title, description }: SeoProps) {
  useEffect(() => {
    document.title = title;
    const element = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    );
    element?.setAttribute('content', description);
  }, [description, title]);

  return null;
}
