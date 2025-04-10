import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { isTestEnvironment } from '../constants';

// test用のプロバイダーを作成
import {
  artifactModel as artifactModelTest,
  chatModel as chatModelTest,
  reasoningModel as reasoningModelTest,
  titleModel as titleModelTest,
} from './models.test';

import { bedrockAgent } from './bedrock-agent';

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


export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModelTest,
        'chat-model-reasoning': reasoningModelTest,
        'title-model': titleModelTest,
        'artifact-model': artifactModelTest,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': bedrockAgent('chat'),
        'chat-model-reasoning': bedrockAgent('reasoning'),
        'title-model': bedrockAgent('title'),
        'artifact-model': bedrockAgent('artifact'),
      },
  });
  