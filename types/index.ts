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
  max_tokens?: number; // Legacy - used for GPT-3.5 and GPT-4
  max_completion_tokens?: number; // GPT-5 models
  reasoning_effort?: "minimal" | "low" | "medium" | "high"; // GPT-5 only
  verbosity?: "low" | "medium" | "high"; // GPT-5 only
};

export type GPT5ReasoningEffort = "minimal" | "low" | "medium" | "high";
export type GPT5Verbosity = "low" | "medium" | "high";
