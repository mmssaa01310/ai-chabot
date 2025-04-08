'use client';

import type { Attachment, UIMessage } from 'ai';
import cx from 'classnames';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  memo,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import equal from 'fast-deep-equal';
import { UseChatHelpers } from '@ai-sdk/react';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { SuggestedActions } from './suggested-actions';
import { ReferencePrompts } from './reference-prompts';
import { AnalysisModal } from './analysis-modal';
import { AnalysisButton } from '@/components/analysis-button';

type MultimodalInputProps = {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
};

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
}: MultimodalInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { width } = useWindowSize();

  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [localStorageInput, setLocalStorageInput] = useLocalStorage('input', '');

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value || '';
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const adjustHeight = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  };

  const resetHeight = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = '96px';
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      if (status !== 'ready') {
        toast.error('Please wait for the model to finish its response!');
      } else {
        submitForm();
      }
    }
  };  

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/chat/${chatId}`);
    handleSubmit(undefined, { experimental_attachments: attachments });
    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();
    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [attachments, handleSubmit, setAttachments, setLocalStorageInput, width, chatId]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;
        return { url, name: pathname, contentType };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      setUploadQueue(files.map((f) => f.name));
      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploaded = await Promise.all(uploadPromises);
        const validUploads = uploaded.filter((a) => a !== undefined);
        setAttachments((current) => [...current, ...validUploads]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments]
  );

  return (
    <div className="relative w-full flex flex-col gap-4 pb-4">
      {messages.length === 0 && attachments.length === 0 && uploadQueue.length === 0 && (
        <SuggestedActions append={append} chatId={chatId} />
      )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}
          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{ url: '', name: filename, contentType: '' }}
              isUploading
            />
          ))}
        </div>
      )}

      <div className="relative w-full">
        <Textarea
          ref={textareaRef}
          placeholder="Send a message..."
          value={input}
          onChange={handleInputChange}
          className={cx(
            'w-full min-h-[96px] resize-none rounded-2xl !text-base bg-muted pl-4 pr-12 pb-12 dark:border-zinc-700',
            className
          )}
          rows={2}
          autoFocus
          style={{ overflow: 'hidden' }}
          onKeyDown={handleKeyDown}
        />

        {/* 左下のアイコン */}
        <div className="absolute bottom-2 left-2 flex gap-2">
          <ReferencePrompts
            onSelect={(text) => {
              setInput(text);
              textareaRef.current?.focus();
              adjustHeight();
            }}
          />
          <AnalysisButton onClick={() => setIsAnalysisOpen(true)} />
          <AttachmentsButton fileInputRef={fileInputRef} status={status} />
        </div>

        {/* 右下の送信ボタン */}
        <div className="absolute bottom-2 right-2">
          {status === 'submitted' ? (
            <StopButton stop={stop} setMessages={setMessages} />
          ) : (
            <SendButton input={input} submitForm={submitForm} uploadQueue={uploadQueue} />
          )}
        </div>
      </div>


      <AnalysisModal
        open={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        onSelectPrompt={(prompt) => {
          setInput(prompt);
          textareaRef.current?.focus();
          setTimeout(() => {
            adjustHeight(); // ← 状態更新後に呼び出す
          }, 0);
        }}
      />
    </div>
  );
}

// ボタン系のサブコンポーネント（変更なし）
const AttachmentsButton = memo(({ fileInputRef, status }: any) => (
  <Button
    className="p-[7px] h-fit"
    onClick={(e) => {
      e.preventDefault();
      fileInputRef.current?.click();
    }}
    disabled={status !== 'ready'}
    variant="ghost"
  >
    <PaperclipIcon size={14} />
  </Button>
));

const StopButton = memo(({ stop, setMessages }: any) => (
  <Button
    className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
    onClick={(e) => {
      e.preventDefault();
      stop();
      setMessages((msgs: any) => msgs);
    }}
  >
    <StopIcon size={14} />
  </Button>
));

const SendButton = memo(
  ({ submitForm, input, uploadQueue }: any) => (
    <Button
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(e) => {
        e.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  ),
  (prev, next) =>
    prev.input === next.input && prev.uploadQueue.length === next.uploadQueue.length
);

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) =>
    prevProps.input === nextProps.input &&
    prevProps.status === nextProps.status &&
    equal(prevProps.attachments, nextProps.attachments)
);
