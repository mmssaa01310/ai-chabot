// lib/ai/bedrock-agent.ts
import {
    BedrockAgentRuntimeClient,
    InvokeAgentCommand,
  } from '@aws-sdk/client-bedrock-agent-runtime';
  import { LanguageModel } from 'ai';
  
  const agentId = process.env.BEDROCK_AGENT_ID!;
  const agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID!;
  const region = process.env.AWS_REGION ?? 'us-east-1';
  
  const client = new BedrockAgentRuntimeClient({ region });
  
  export function bedrockAgentModel(): LanguageModel {
    return {
      id: `bedrock-agent-${agentId}`,
      async call({ prompt }) {
        const command = new InvokeAgentCommand({
          agentId,
          agentAliasId,
          sessionId: crypto.randomUUID(),
          inputText: prompt.text,
        });
  
        const response = await client.send(command);
        const body = await response.completion?.text(); // 必要に応じて変換
        return { text: body ?? '' };
      },
    };
  }
  