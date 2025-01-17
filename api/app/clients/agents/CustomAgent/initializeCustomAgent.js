const CustomAgent = require('./CustomAgent');
const { CustomOutputParser } = require('./outputParser');
const { AgentExecutor } = require('langchain/agents');
const { LLMChain } = require('langchain/chains');
const { ConversationSummaryBufferMemory, ChatMessageHistory } = require('langchain/memory');
const {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} = require('langchain/prompts');

const initializeCustomAgent = async ({
  tools,
  model,
  pastMessages,
  currentDateString,
  ...rest
}) => {
  let prompt = CustomAgent.createPrompt(tools, { currentDateString, model: model.modelName });

  const chatPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessagePromptTemplate(prompt),
    HumanMessagePromptTemplate.fromTemplate(`{chat_history}
Query: {input}
{agent_scratchpad}`),
  ]);

  const outputParser = new CustomOutputParser({ tools });

  const memory = new ConversationSummaryBufferMemory({
    llm: model,
    chatHistory: new ChatMessageHistory(pastMessages),
    // returnMessages: true, // commenting this out retains memory
    memoryKey: 'chat_history',
    humanPrefix: 'User',
    aiPrefix: 'Assistant',
    inputKey: 'input',
    outputKey: 'output',
  });

  const llmChain = new LLMChain({
    prompt: chatPrompt,
    llm: model,
  });

  const agent = new CustomAgent({
    llmChain,
    outputParser,
    allowedTools: tools.map((tool) => tool.name),
  });

  return AgentExecutor.fromAgentAndTools({ agent, tools, memory, ...rest });
};

module.exports = initializeCustomAgent;
