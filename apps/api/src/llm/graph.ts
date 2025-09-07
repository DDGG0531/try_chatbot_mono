import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages';

type Options = { model?: string; temperature?: number; apiKey?: string };

export function makeSimpleGraph(opts: Options = {}) {
  const llm = new ChatOpenAI({
    apiKey: opts.apiKey || process.env.OPENAI_API_KEY,
    model: opts.model || 'gpt-4o-mini',
    temperature: opts.temperature ?? 0.2,
    streaming: true,
  });

  const callModel = async (state: typeof MessagesAnnotation.State) => {
    const resp = await llm.invoke(state.messages as BaseMessage[]);
    return { messages: [resp] };
  };

  return new StateGraph(MessagesAnnotation)
    .addNode('model', callModel)
    .addEdge(START, 'model')
    .addEdge('model', END)
    .compile();
}

export function toLcMessages(messages: Array<{ role: string; content: string }>): BaseMessage[] {
  return messages.map((m) => {
    switch (m.role) {
      case 'user':
        return new HumanMessage(m.content);
      case 'assistant':
        return new AIMessage(m.content);
      case 'system':
        return new SystemMessage(m.content);
      case 'tool':
        return new ToolMessage({ tool_call_id: 'tool', content: m.content });
      default:
        return new HumanMessage(m.content);
    }
  });
}

