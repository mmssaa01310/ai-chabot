import type { UIMessage } from 'ai';
import {
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { myProvider } from '@/lib/ai/providers';
import { NextResponse } from 'next/server';
import { updateChatTitle } from '@/lib/db/queries';


export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
    } = await request.json();

    console.log('messages', messages);

    let session = await auth();

    // if (!session || !session.user || !session.user.id) {
    //   return new Response('Unauthorized', { status: 401 });
    // }

    if (!session || !session.user?.id) {
      // 開発中のみ仮ユーザーを挿入
      session = { user: { id: 'dev-user-id' } };
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: userMessage.id,
          role: 'user',
          parts: userMessage.parts,
          attachments: userMessage.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    return createDataStreamResponse({
      execute: (dataStream) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel }),
          messages,
          maxSteps: 5,
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                ],
          experimental_transform: smoothStream({ chunking: 'word' }),
          experimental_generateMessageId: generateUUID,
          tools: {
            // APIで外部に取りに行くのでコメントアウト
            // getWeather,
            // createDocument: createDocument({ session, dataStream }),
            // updateDocument: updateDocument({ session, dataStream }),
            // requestSuggestions: requestSuggestions({
            //   session,
            //   dataStream,
            // }),
          },
          onFinish: async ({ response }) => {
            if (session.user?.id) {
              try {
                const assistantId = getTrailingMessageId({
                  messages: response.messages.filter(
                    (message) => message.role === 'assistant',
                  ),
                });

                if (!assistantId) {
                  throw new Error('No assistant message found!');
                }

                const [, assistantMessage] = appendResponseMessages({
                  messages: [userMessage],
                  responseMessages: response.messages,
                });

                await saveMessages({
                  messages: [
                    {
                      id: assistantId,
                      chatId: id,
                      role: assistantMessage.role,
                      parts: assistantMessage.parts,
                      attachments:
                        assistantMessage.experimental_attachments ?? [],
                      createdAt: new Date(),
                    },
                  ],
                });
              } catch (_) {
                console.error('Failed to save chat');
              }
            }
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        result.consumeStream();

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occured!';
      },
    });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 404,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}

//追加部分

export async function GET() {
  const id = generateUUID();
  return NextResponse.json({ id });
}


// PATCH: チャットタイトルを更新するエンドポイント
// URL例: /api/chat?id=chat-id-123
// 期待されるリクエストボディ: { "title": "新しいタイトル" }

export async function PATCH(request: Request) {
  // クエリパラメータからチャットIDを取得
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing chat ID', { status: 400 });
  }

  // ユーザー認証（ログインしているか確認）
  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // リクエストボディから新しいタイトルを取得
  const { title } = await request.json();

  if (typeof title !== 'string' || title.trim() === '') {
    return new Response('Invalid title', { status: 400 });
  }

  // 指定されたチャットが現在のユーザーのものであるか確認
  const chat = await getChatById({ id });

  if (!chat || chat.userId !== session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // チャットのタイトルを保存（更新処理）
    await updateChatTitle({
      id,
      title: title.trim(),
    });

    return new Response(null, { status: 204 }); // 成功（内容なし）
  } catch (error) {
    console.error('Failed to update chat title', error);
    return new Response('Failed to update title', { status: 500 });
  }
}
