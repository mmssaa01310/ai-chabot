'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const locales = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'th', label: 'ไทย' },
];

export function LanguageSelector() {
  const router = useRouter();
  const locale = useLocale();

  const changeLocale = (newLocale: string) => {
    localStorage.setItem('lang', newLocale); // ✅ client側
    document.cookie = `lang=${newLocale}; path=/; max-age=31536000`; // ✅ SSR用にcookieも設定
    router.refresh(); // ✅ App Routerで再描画
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-8 px-3 text-sm">
          {locales.find((l) => l.code === locale)?.label ?? 'Language'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map(({ code, label }) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => changeLocale(code)}
            disabled={locale === code}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
