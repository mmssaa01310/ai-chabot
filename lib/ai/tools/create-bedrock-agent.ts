import {
    BedrockAgentRuntimeClient,
    InvokeAgentCommand,
  } from '@aws-sdk/client-bedrock-agent-runtime';
  import { LanguageModelV1 } from 'ai';
  
  type BedrockAgentModelId = 'chat' | 'reasoning' | 'title' | 'artifact' | (string & {});
  type BedrockAgentSettings = {
    agentId: string;
    aliasId: string;
    region?: string;
  };

  type UIMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string | { text: string }[];
  };
  
  export function createBedrockAgent(settings: BedrockAgentSettings) {
    
    const region = settings.region ?? 'ap-northeast-1';
    const client = new BedrockAgentRuntimeClient({
      region,
      endpoint: `https://bedrock-agent-runtime.${region}.amazonaws.com`,
    });
  
    function languageModel(modelId: BedrockAgentModelId): LanguageModelV1 {
      return {
        specificationVersion: 'v1',
        provider: 'bedrock-agent',
        modelId,
        defaultObjectGenerationMode: undefined,
  
        async doGenerate(options) {
          const messages = (options as any).messages as UIMessage[] | undefined;
          const userMessage = messages?.find((m) => m.role === 'user');
          if (!userMessage || !userMessage.content) {
            throw new Error('No user message found');
          }
  
          const prompt =
            typeof userMessage.content === 'string'
              ? userMessage.content
              : userMessage.content[0]?.text ?? '';
  
          const sessionId = `${modelId}-${Math.random().toString(36).substring(2, 8)}`;
  
          const command = new InvokeAgentCommand({
            agentId: settings.agentId,
            agentAliasId: settings.aliasId,
            sessionId,
            inputText: prompt, 
            enableTrace: true,
          });
  
          const response = await client.send(command);
          let fullText = '';
  
          if (response.completion) {
            for await (const chunk of response.completion) {
              if (chunk.chunk?.bytes) {
                const jsonStr = new TextDecoder().decode(chunk.chunk.bytes);
                const json = JSON.parse(jsonStr);
                const text = json?.content?.text;
                if (text) fullText += text;
              }
            }
          }
  
          return {
            text: fullText,
            finishReason: 'stop',
            usage: {
              promptTokens: 0,
              completionTokens: 0,
            },
            rawCall: {
              rawPrompt: prompt,
              rawSettings: {},
            },
          };
        },
  
        async doStream() {
          throw new Error('doStream not implemented');
        },
      };
    }
  
    return Object.assign(languageModel, {
      languageModel,
      chat: languageModel, // `bedrockAgent.chat('chat')` 形式でも呼び出せる
    });
  }
  