// 言語切替のためのプロバイダー
// app/providers.tsx
'use client';

import { IntlProvider } from 'next-intl';
import { useEffect, useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState('ja');
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') || 'ja';
    import(`../messages/${savedLang}.json`).then((mod) => {
      setMessages(mod.default);
      setLocale(savedLang);
    });
  }, []);

  if (!messages || Object.keys(messages).length === 0) return null;

  return (
    <IntlProvider messages={messages} locale={locale}>
      {children}
    </IntlProvider>
  );
}
