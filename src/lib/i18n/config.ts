import { getRequestConfig as getNextIntlRequestConfig } from 'next-intl/server';

export const locales = ['fr', 'ha', 'zm'] as const;
export const defaultLocale = 'fr' as const;
export const localeNames: Record<typeof locales[number], { fr: string; ha: string; zm: string }> = {
  fr: { fr: 'Français', ha: 'Français', zm: 'Faranji' },
  ha: { fr: 'Haoussa', ha: 'Hausà', zm: 'Haussa' },
  zm: { fr: 'Zarma', ha: 'Zarma', zm: 'Zarma' },
};

export const getRequestConfig = getNextIntlRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default,
}));