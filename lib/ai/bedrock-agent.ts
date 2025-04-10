import { createBedrockAgent } from './tools/create-bedrock-agent';

export const bedrockAgent = createBedrockAgent({
  agentId: process.env.BEDROCK_AGENT_ID!,
  aliasId: process.env.BEDROCK_AGENT_ALIAS_ID!,
});
