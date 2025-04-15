import { customProvider } from 'ai';
import { isTestEnvironment } from '../constants';

// テスト用のプロバイダーを作成
import {
  artifactModel as artifactModelTest,
  chatModel as chatModelTest,
  reasoningModel as reasoningModelTest,
  titleModel as titleModelTest,
} from './models.test';

// ◆createBedrockAgent をインポート
import { createBedrockAgent } from './tools/create-bedrock-agent';

// createBedrockAgentでベースを作成
const bedrockAgentBase = createBedrockAgent({
  agentId: process.env.BEDROCK_AGENT_ID!,
  aliasId: process.env.BEDROCK_AGENT_ALIAS_ID!,
  region: 'ap-northeast-1', // 必要に応じて
});

// bedrockAgent関数を定義し、modelIdを渡して languageModel を返す
function bedrockAgent(modelId: string) {
  return bedrockAgentBase.languageModel(modelId);
}

// provider本体
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
