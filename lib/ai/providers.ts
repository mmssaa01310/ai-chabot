import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

// export const myProvider = isTestEnvironment
//   ? customProvider({
//       languageModels: {
//         'chat-model': chatModel,
//         'chat-model-reasoning': reasoningModel,
//         'title-model': titleModel,
//         'artifact-model': artifactModel,
//       },
//     })
//   : customProvider({
//       languageModels: {
//         'chat-model': deepseek('deepseek-chat'),
//         'chat-model-reasoning': deepseek('deepseek-reasoner'),
//         'title-model': deepseek('deepseek-chat'),
//         'artifact-model': deepseek('deepseek-chat'),
//       },
//     });


import { invokeBedrockAgent } from './bedrock-agent'; 
export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': {
          async call({ prompt }) {
            const sessionId = crypto.randomUUID(); // 毎回新規セッションも可能
            const result = await invokeBedrockAgent(prompt.text, sessionId);
            return { text: result.completion };
          },
        },
        'chat-model-reasoning': {
          async call({ prompt }) {
            const sessionId = crypto.randomUUID();
            const result = await invokeBedrockAgent(prompt.text, sessionId);
            return { text: result.completion };
          },
        },
        'title-model': {
          async call({ prompt }) {
            const sessionId = crypto.randomUUID();
            const result = await invokeBedrockAgent(prompt.text, sessionId);
            return { text: result.completion };
          },
        },
        'artifact-model': {
          async call({ prompt }) {
            const sessionId = crypto.randomUUID();
            const result = await invokeBedrockAgent(prompt.text, sessionId);
            return { text: result.completion };
          },
        },
      },
    });
  