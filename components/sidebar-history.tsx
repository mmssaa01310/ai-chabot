'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { memo, useEffect, useState } from 'react';
import { toast } from 'sonner';
import useSWR, { useSWRConfig } from 'swr';

import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  TrashIcon,
} from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import type { Chat } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { PencilIcon } from 'lucide-react';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

//
// ====================================================
// 1) PureChatItem: チャット一つ分の表示 + タイトル編集
// ====================================================
//

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  // ※ visibilityType は必要なければ特に使わなくてもOK
  const { visibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibility: chat.visibility,
  });

  // タイトルの編集フラグ & 編集中タイトル
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);

  // SWR キャッシュを操作するフック
  const { mutate } = useSWRConfig();

  // ===============================
  // タイトル変更時に呼ばれる関数
  // ===============================
  const handleRename = async () => {
    setIsEditing(false);

    // trim()して空or変更なしなら何もしない
    const newTitle = title.trim();
    if (!newTitle || newTitle === chat.title) {
      setTitle(chat.title); // 元に戻す
      return;
    }

    // --- 1) 楽観的更新：/api/history のキャッシュを直接書き換えてUIに即反映 ---
    // mutate の第3引数に false を渡すと「再フェッチなし」でキャッシュのみ更新できます
    const oldChats = mutate(
      '/api/history',
      (chats: Chat[] = []) => {
        return chats.map((c) =>
          c.id === chat.id ? { ...c, title: newTitle } : c
        );
      },
      false // ← これで即時にキャッシュ更新
    );

    // これでSidebar上のリストも newTitle 表示に変わります

    try {
      // --- 2) サーバーに PATCH リクエスト ---
      const res = await fetch(`/api/chat?id=${chat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) {
        throw new Error('Failed to update title');
      }

      // --- 3) 成功時はサーバーと整合性を取るために再フェッチ ---
      mutate('/api/history'); // ← ここで最新データを再取得
    } catch (error) {
      // --- 4) エラー時にはロールバック(キャッシュを元に戻す) ---
      mutate('/api/history', oldChats, false);
      setTitle(chat.title);
      toast.error('タイトルの保存に失敗しました');
    }
  };

  return (
    <SidebarMenuItem>
      {/* チャットタイトル部分 */}
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
          {isEditing ? (
            <input
              type="text"
              className="w-full bg-transparent text-sm border-b border-zinc-300 focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleRename();
                }
              }}
              autoFocus
            />
          ) : (
            <span>{title}</span>
          )}
        </Link>
      </SidebarMenuButton>

      {/* 右側アクション (Rename, Deleteなど) */}
      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          {/* ここでRenameボタンを押すとインライン編集モードへ */}
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            <PencilIcon size={14} className="mr-2" />
            <span>Rename</span>
          </DropdownMenuItem>

          {/* 削除ボタン */}
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(chat.id)}
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

// メモ化の比較関数: タイトルや isActive が変わったら再レンダ
export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.chat.title === nextProps.chat.title
  );
});

//
// ====================================================
// 2) SidebarHistory: チャットリスト全体の描画
// ====================================================
//

export function SidebarHistory({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const pathname = usePathname();

  // チャット履歴の取得
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<Chat>>(user ? '/api/history' : null, fetcher, {
    fallbackData: [],
  });

  // パスが変わるたびに再取得
  useEffect(() => {
    mutate();
  }, [pathname, mutate]);

  // チャット削除
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!deleteId) return;

    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        // ローカルキャッシュからも削除
        mutate('/api/history', (chats: Chat[] = []) =>
          chats.filter((h) => h.id !== deleteId)
        );

        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
    });

    setShowDeleteDialog(false);

    // 削除対象チャットを閲覧中ならトップへ
    if (deleteId === id) {
      router.push('/');
    }
  };

  // ログインしてない場合
  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // ロード中
  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">Today</div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div key={item} className="rounded-md h-8 flex gap-2 px-2 items-center">
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                  style={{ '--skeleton-width': `${item}%` } as React.CSSProperties}
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // 履歴が0件
  if (history?.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // チャットを作成日時でグループ分け
  const groupChatsByDate = (chats: Chat[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return chats.reduce(
      (groups, c) => {
        const chatDate = new Date(c.createdAt);

        if (isToday(chatDate)) {
          groups.today.push(c);
        } else if (isYesterday(chatDate)) {
          groups.yesterday.push(c);
        } else if (chatDate > oneWeekAgo) {
          groups.lastWeek.push(c);
        } else if (chatDate > oneMonthAgo) {
          groups.lastMonth.push(c);
        } else {
          groups.older.push(c);
        }

        return groups;
      },
      {
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
      } as GroupedChats
    );
  };

  const groupedChats = groupChatsByDate(history || []);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {/* Today */}
            {groupedChats.today.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                  Today
                </div>
                {groupedChats.today.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    onDelete={(chatId) => {
                      setDeleteId(chatId);
                      setShowDeleteDialog(true);
                    }}
                    setOpenMobile={setOpenMobile}
                  />
                ))}
              </>
            )}

            {/* Yesterday */}
            {groupedChats.yesterday.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                  Yesterday
                </div>
                {groupedChats.yesterday.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    onDelete={(chatId) => {
                      setDeleteId(chatId);
                      setShowDeleteDialog(true);
                    }}
                    setOpenMobile={setOpenMobile}
                  />
                ))}
              </>
            )}

            {/* Last 7 days */}
            {groupedChats.lastWeek.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                  Last 7 days
                </div>
                {groupedChats.lastWeek.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    onDelete={(chatId) => {
                      setDeleteId(chatId);
                      setShowDeleteDialog(true);
                    }}
                    setOpenMobile={setOpenMobile}
                  />
                ))}
              </>
            )}

            {/* Last 30 days */}
            {groupedChats.lastMonth.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                  Last 30 days
                </div>
                {groupedChats.lastMonth.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    onDelete={(chatId) => {
                      setDeleteId(chatId);
                      setShowDeleteDialog(true);
                    }}
                    setOpenMobile={setOpenMobile}
                  />
                ))}
              </>
            )}

            {/* Older */}
            {groupedChats.older.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                  Older
                </div>
                {groupedChats.older.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === id}
                    onDelete={(chatId) => {
                      setDeleteId(chatId);
                      setShowDeleteDialog(true);
                    }}
                    setOpenMobile={setOpenMobile}
                  />
                ))}
              </>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Delete ダイアログ */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
