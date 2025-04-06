'use client';

import { useEffect, useRef, useState } from 'react';
import { MessagesSquare, X, Check, XCircle, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLocalStorage } from 'usehooks-ts';

export function ReferencePrompts({
  onSelect,
}: {
  onSelect: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('reference-prompts');

  const initialPrompts = [t('prompt1'), t('prompt2'), t('prompt3')];
  const [customPrompts, setCustomPrompts] = useLocalStorage<string[]>('custom-prompts', []);
  const displayPrompts = [...initialPrompts, ...customPrompts];

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  const handleAdd = (text: string) => {
    setCustomPrompts((prev) => [...prev, text]);
  };

  const handleDelete = (index: number) => {
    setCustomPrompts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEdit = (index: number, newText: string) => {
    setCustomPrompts((prev) =>
      prev.map((item, i) => (i === index ? newText : item))
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setEditIndex(null);
        setEditText('');
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        className="p-2 text-gray-600 hover:text-black"
        onClick={() => setOpen((prev) => !prev)}
        title={t('title')}
      >
        <MessagesSquare size={16} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-96 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg ring-1 ring-black/5 z-50">
          {/* ヘッダー */}
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 dark:border-zinc-600">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('title')}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          </div>

          {/* プロンプトリスト */}
          <ul className="max-h-64 overflow-y-auto">
            {displayPrompts.map((s, i) => {
              const isCustom = i >= initialPrompts.length;
              const customIndex = i - initialPrompts.length;
              const isEditing = editIndex === i;

              return (
                <li
                  key={i}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 flex justify-between items-center hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors duration-150"
                >
                  {isEditing ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 bg-transparent border-b border-gray-300 focus:outline-none mr-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                      placeholder={t('addPlaceholder')}
                    />
                  ) : (
                    <span
                      onClick={() => {
                        onSelect(s);
                        setOpen(false);
                      }}
                      className="flex-1 cursor-pointer"
                    >
                      {s}
                    </span>
                  )}

                  {isCustom && (
                    <div className="flex items-center space-x-1 ml-2">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (editText.trim()) {
                                handleEdit(customIndex, editText.trim());
                              }
                              setEditIndex(null);
                              setEditText('');
                            }}
                            className="text-green-500 hover:text-green-600"
                            title={t('save')}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditIndex(null);
                              setEditText('');
                            }}
                            className="text-red-400 hover:text-red-600"
                            title={t('cancel')}
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditIndex(i);
                              setEditText(s);
                            }}
                            className="text-gray-400 hover:text-blue-500"
                            title={t('edit')}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(customIndex)}
                            className="text-gray-400 hover:text-red-500"
                            title={t('delete')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* 追加欄 */}
          <div className="flex gap-2 items-center px-4 py-3 border-t border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800">
            <input
              type="text"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder={t('addPlaceholder')}
              className="flex-1 p-2 text-sm rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (newPrompt.trim()) {
                  handleAdd(newPrompt.trim());
                  setNewPrompt('');
                }
              }}
              disabled={!newPrompt.trim()}
              className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {t('addButton')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
