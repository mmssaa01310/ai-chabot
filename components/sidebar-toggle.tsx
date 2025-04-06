'use client';

import type { ComponentProps } from 'react';
import { useTranslations } from 'next-intl';

import { type SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { SidebarLeftIcon } from './icons';
import { Button } from './ui/button';

export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar, open } = useSidebar(); // open を取得
  const t = useTranslations('sidebar'); // 翻訳キー取得

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={toggleSidebar}
          variant="outline"
          className="md:px-2 md:h-fit"
        >
          <SidebarLeftIcon size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">
        {open ? t('hide') : t('show')} {/* 状態に応じて切替 */}
      </TooltipContent>
    </Tooltip>
  );
}
