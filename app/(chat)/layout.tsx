// app/(chat)/layout.tsx
import { cookies } from 'next/headers';
import Script from 'next/script';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import { auth } from '../(auth)/auth';
import { getMessages } from '@/lib/i18n';
import SidebarProviderWrapper from '@/components/sidebar-provider-wrapper'; // ✅ 追加
import { NextIntlClientProvider } from 'next-intl';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  const lang = cookieStore.get('lang')?.value || 'ja';
  const messages = await getMessages(lang);

  return (
    <>
      {/* <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      /> */}

      <NextIntlClientProvider locale={lang} messages={messages}>
        <SidebarProviderWrapper defaultOpen={!isCollapsed}> {/* ✅ クライアントでSidebarProviderを適用 */}
          <AppSidebar user={session?.user} />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProviderWrapper>
      </NextIntlClientProvider>
    </>
  );
}
