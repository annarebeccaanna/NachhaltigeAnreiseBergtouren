import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const SUPPORTED_LOCALES = ['de', 'en'] as const;
// FR/IT/SL folgen vor dem Livegang (KONZEPT.md § 7.1)
const DEFAULT_LOCALE = 'de';

/**
 * Sprachauswahl gemäß Konzept § 7.1:
 * 1. Cookie (manuelle Wahl des Users, übersteuert alles)
 * 2. Browser-Sprache (Accept-Language)
 * 3. Land aus IP (Vercel-Header x-vercel-ip-country) als Fallback
 */
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get('locale')?.value;
  const headerStore = await headers();

  let locale: string | undefined = cookieLocale;

  if (!locale || !isSupported(locale)) {
    const acceptLanguage = headerStore.get('accept-language') ?? '';
    locale = acceptLanguage
      .split(',')
      .map((part) => part.trim().slice(0, 2).toLowerCase())
      .find(isSupported);
  }

  if (!locale) {
    const country = headerStore.get('x-vercel-ip-country')?.toUpperCase();
    const byCountry: Record<string, string> = {
      DE: 'de', AT: 'de', CH: 'de', LI: 'de',
      FR: 'en', IT: 'en', SI: 'en', MC: 'en', // bis FR/IT/SL übersetzt sind
    };
    locale = country ? byCountry[country] : undefined;
  }

  if (!locale || !isSupported(locale)) locale = DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});

function isSupported(l: string): l is (typeof SUPPORTED_LOCALES)[number] {
  return (SUPPORTED_LOCALES as readonly string[]).includes(l);
}
