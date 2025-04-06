// miyazaki追加
'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { ReactNode } from 'react';

export default function SidebarProviderWrapper({
  children,
  defaultOpen = true,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return <SidebarProvider defaultOpen={defaultOpen}>{children}</SidebarProvider>;
}