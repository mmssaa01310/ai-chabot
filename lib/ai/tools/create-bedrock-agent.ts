// create-bedrock-agent.ts (修正版: wrapLanguageModel + middleware 明示的に追加)
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  InvokeAgentCommandOutput,
} from '@aws-sdk/client-bedrock-agent-runtime';
import {
  LanguageModelV1CallOptions,
  LanguageModelV1StreamPart,
  wrapLanguageModel,
} from 'ai';


// UIMessage 型の定義
type UIMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string | { text: string }[];
};

type BedrockAgentModelId = 'chat' | 'reasoning' | 'title' | 'artifact' | (string & {});

type BedrockAgentSettings = {
  agentId: string;
  aliasId: string;
  region?: string;
};

export function createBedrockAgent(settings: BedrockAgentSettings) {
  const region = settings.region ?? 'ap-northeast-1';
  const client = new BedrockAgentRuntimeClient({
    region,
    endpoint: `https://bedrock-agent-runtime.${region}.amazonaws.com`,
  });

  function languageModel(modelId: BedrockAgentModelId) {
    return wrapLanguageModel({
      model: {
        specificationVersion: 'v1',
        modelId,
        provider: 'bedrock-agent',
        defaultObjectGenerationMode: undefined,

        async doGenerate(options) {
          const messages = (options as any).messages as UIMessage[];
          const prompt = extractPrompt(messages);
          const sessionId = generateSessionId(modelId);

          try {
            const response = await client.send(
              new InvokeAgentCommand({
                agentId: settings.agentId,
                agentAliasId: settings.aliasId,
                sessionId,
                inputText: prompt,
                enableTrace: true,
              })
            );

            let fullText = '';
            if (response.completion) {
              for await (const chunk of response.completion) {
                const text = decodeChunk(chunk);
                if (text) fullText += text;
              }
            }

            return {
              text: fullText || '[Bedrock Agent returned no content]',
              finishReason: 'stop',
              usage: { promptTokens: 0, completionTokens: 0 },
              rawCall: { rawPrompt: prompt, rawSettings: {} },
            };
          } catch (error) {
            console.error('Bedrock Agent Error:', error);
            return {
              text: '[テスト用メッセージ]現在ベドロックエージェントとの通信に問題があります。',
              finishReason: 'error',
              usage: { promptTokens: 0, completionTokens: 0 },
              rawCall: { rawPrompt: prompt, rawSettings: {} },
            };
          }
        },

        async doStream(options: LanguageModelV1CallOptions) {
          const messages = (options as any).messages as UIMessage[];
          const prompt = extractPrompt(messages);
          const sessionId = generateSessionId(modelId);

          try {
            const response: InvokeAgentCommandOutput = await client.send(
              new InvokeAgentCommand({
                agentId: settings.agentId,
                agentAliasId: settings.aliasId,
                sessionId,
                inputText: prompt,
                enableTrace: true,
              })
            );

            const stream = new ReadableStream<LanguageModelV1StreamPart>({
              async start(controller) {
                if (!response.completion) {
                  controller.enqueue({ type: 'text-delta', textDelta: '[Bedrock Agent returned no stream]' });
                  controller.close();
                  return;
                }

                for await (const chunk of response.completion) {
                  const text = decodeChunk(chunk);
                  if (text) controller.enqueue({ type: 'text-delta', textDelta: text });
                }
                controller.close();
              },
            });

            return {
              stream,
              rawCall: { rawPrompt: prompt, rawSettings: {} },
              rawResponse: { headers: {} },
              request: { body: JSON.stringify({ prompt }) },
              warnings: undefined,
            };
          } catch (error) {
            console.error('doStream error:', error);
            const errorStream = new ReadableStream<LanguageModelV1StreamPart>({
              start(controller) {
                controller.enqueue({ type: 'text-delta', textDelta: 'Bedrock Agent接続に失敗しました。' });
                controller.close();
              },
            });
            return {
              stream: errorStream,
              rawCall: { rawPrompt: prompt, rawSettings: {} },
              warnings: [{ type: 'other', message: 'Bedrock Agent 接続失敗' }],
            };
          }
        },
      },
      middleware: [],
    });
  }

  return Object.assign(languageModel, {
    languageModel,
    chat: languageModel,
  });
}

function extractPrompt(messages: UIMessage[] | undefined): string {
  const userMessage = messages?.find((m) => m.role === 'user');
  if (!userMessage || !userMessage.content) throw new Error('No user message found');
  return typeof userMessage.content === 'string'
    ? userMessage.content
    : userMessage.content[0]?.text ?? '';
}

function generateSessionId(modelId: string): string {
  return `${modelId}-${Math.random().toString(36).substring(2, 8)}`;
}

function decodeChunk(chunk: any): string | undefined {
  try {
    if (chunk.chunk?.bytes) {
      const jsonStr = new TextDecoder().decode(chunk.chunk.bytes);
      const json = JSON.parse(jsonStr);
      return json?.content?.text;
    }
  } catch (err) {
    console.warn('Chunk decode error:', err);
  }
  return undefined;
}
