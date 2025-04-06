// i18n/request.ts
import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

type SupportedLocale = 'ja' | 'en' | 'zh' | 'th';

export default getRequestConfig(async ({requestLocale}) => {
  const resolvedLocale = await requestLocale;

  // ✅ Type Guard を使って安全に判定
  const isSupportedLocale = (locale: string): locale is SupportedLocale =>
    routing.locales.includes(locale as SupportedLocale);

  const locale: SupportedLocale = isSupportedLocale(resolvedLocale ?? '')
    ? resolvedLocale as SupportedLocale
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default
  };
});
