'use client';

import { useLocale, useTranslations } from 'next-intl';

const LOCALES = ['de', 'en'] as const;

/** Manuelle Sprachwahl per Cookie – übersteuert die Automatik (§ 7.1). */
export default function LanguageSwitcher() {
  const t = useTranslations('lang');
  const locale = useLocale();

  function switchTo(next: string) {
    document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <label className="langswitch">
      {t('label')}:{' '}
      <select value={locale} onChange={(e) => switchTo(e.target.value)}>
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {t(l)}
          </option>
        ))}
      </select>
    </label>
  );
}
