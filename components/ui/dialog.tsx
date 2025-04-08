'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react'; // 閉じるアイコン（任意）

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
      {children}
    </div>
  );
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return (
    <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
      {children}
    </DialogPrimitive.Title>
  );
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return (
    <DialogPrimitive.Description className="text-sm text-muted-foreground">
      {children}
    </DialogPrimitive.Description>
  );
}

export function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/30 z-50 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700',
          'rounded-lg shadow-lg p-6 w-[90vw] max-w-xl focus:outline-none',
          className
        )}
        {...props}
      >
        {children}

        {/* 閉じるボタンを右上に表示したい場合のオプション */}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <X className="h-4 w-4" />
          <span className="sr-only">閉じる</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
