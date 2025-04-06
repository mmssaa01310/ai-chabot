'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatModels } from '@/lib/ai/models';
import { cn } from '@/lib/utils';
import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

export function ModelSelector({
  selectedModelId,
  className,
}: {
  selectedModelId: string;
} & React.ComponentProps<typeof Button>) {
  const router = useRouter();
  const t = useTranslations('modelSelector');

  const [currentModelId, setCurrentModelId] = useState<string>(selectedModelId);
  const [open, setOpen] = useState(false);

  const selectedChatModel = useMemo(
    () => chatModels.find((chatModel) => chatModel.id === currentModelId),
    [currentModelId]
  );

  // SSR 初期値からローカル保存モデルに切り替え（もしあれば）
  useEffect(() => {
    const cookieMatch = document.cookie
      .split('; ')
      .find((row) => row.startsWith('chatModelId='));
    const cookieModelId = cookieMatch?.split('=')[1];
    if (cookieModelId && cookieModelId !== selectedModelId) {
      setCurrentModelId(cookieModelId);
    }
  }, [selectedModelId]);

  const handleSelect = (id: string) => {
    setCurrentModelId(id);
    document.cookie = `chatModelId=${id}; path=/; max-age=31536000`; // 1年保存
    setOpen(false);
    router.refresh(); // SSRデータをリロード（必要な場合）
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="model-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
        >
          {selectedChatModel?.name ?? t('placeholder')}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {chatModels.map((chatModel) => {
          const { id, name } = chatModel;
          const key = id;

          return (
            <DropdownMenuItem
              key={id}
              onSelect={() => handleSelect(id)}
              data-active={id === currentModelId}
              asChild
            >
              <button
                type="button"
                className="gap-4 group/item flex flex-row justify-between items-center w-full"
              >
                <div className="flex flex-col gap-1 items-start">
                  <div>{t(`${key}.name`, { fallback: name })}</div>
                  <div className="text-xs text-muted-foreground">
                    {t(`${key}.description`, { fallback: '' })}
                  </div>
                </div>
                <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                  <CheckCircleFillIcon />
                </div>
              </button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
