import { getLocale } from 'next-intl/server';
import type { ReactElement } from 'react';

export default async function request(
  request: Request
): Promise<{
  locale: string;
  messages: Record<string, React.ReactNode>;
}> {
  // Get locale from request headers or cookie
  const locale = (await getLocale()) || 'fr';

  // Load messages based on locale
  const messages = (await import(`../messages/${locale}.json`)).default;

  return { locale, messages };
}