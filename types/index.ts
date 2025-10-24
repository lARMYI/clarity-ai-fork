export enum OpenAIModel {
  DAVINCI_TURBO = "gpt-3.5-turbo",
  GPT_5 = "gpt-5",
  GPT_5_MINI = "gpt-5-mini",
  GPT_5_NANO = "gpt-5-nano"
}

export type Source = {
  url: string;
  text: string;
};

export type SearchQuery = {
  query: string;
  sourceLinks: string[];
};

export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
  };
};

export type AgentConfig = {
  model: OpenAIModel;
  tools: ToolDefinition[];
  temperature?: number;
  max_tokens?: number;
};
