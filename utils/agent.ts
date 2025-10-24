import { OpenAIModel, ToolDefinition, Source } from "@/types";
import { executeToolCall } from "./tools";

export interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export class AIAgent {
  private apiKey: string;
  private model: OpenAIModel;
  private tools: ToolDefinition[];
  private messages: AgentMessage[] = [];
  private maxIterations: number = 5;

  constructor(apiKey: string, model: OpenAIModel, tools: ToolDefinition[]) {
    this.apiKey = apiKey;
    this.model = model;
    this.tools = tools;

    // Initialize with system message
    this.messages.push({
      role: "system",
      content: "You are a helpful AI agent that can use tools to answer questions. When you need information, use the available tools. Always provide clear, accurate answers based on the information you gather."
    });
  }

  async run(userQuery: string, sources?: Source[]): Promise<string> {
    // Add sources to context if provided
    let contextualQuery = userQuery;
    if (sources && sources.length > 0) {
      const sourcesText = sources.map((s, idx) => `Source [${idx + 1}] (${s.url}):\n${s.text}`).join("\n\n");
      contextualQuery = `Based on the following sources, ${userQuery}\n\nSources:\n${sourcesText}`;
    }

    this.messages.push({
      role: "user",
      content: contextualQuery
    });

    let iteration = 0;
    let finalResponse = "";

    while (iteration < this.maxIterations) {
      iteration++;

      const response = await this.callOpenAI();

      // Check if the model wants to use tools
      if (response.tool_calls && response.tool_calls.length > 0) {
        // Execute tool calls
        for (const toolCall of response.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          console.log(`Agent executing tool: ${toolName}`, toolArgs);

          const toolResult = await executeToolCall(toolName, toolArgs);

          // Add tool result to messages
          this.messages.push({
            role: "tool",
            content: toolResult,
            tool_call_id: toolCall.id,
            name: toolName
          });
        }

        // Add assistant's tool call to messages
        this.messages.push({
          role: "assistant",
          content: response.content || "",
          tool_calls: response.tool_calls
        });

        // Continue loop to get final response
        continue;
      } else {
        // No more tool calls, we have the final answer
        finalResponse = response.content || "";
        break;
      }
    }

    return finalResponse;
  }

  private async callOpenAI(): Promise<any> {
    // Check if this is a GPT-5 model
    const isGPT5 = this.model.startsWith("gpt-5");

    const requestBody: any = {
      model: this.model,
      messages: this.messages,
      tools: this.tools,
      tool_choice: "auto",
      temperature: 0.0
    };

    // GPT-5 vs Legacy model parameters
    if (isGPT5) {
      // GPT-5 - NO max_completion_tokens, optional reasoning_effort and verbosity
      // Use low reasoning for faster agent iterations
      requestBody.reasoning_effort = "low";
      requestBody.verbosity = "medium";
    } else {
      // Legacy models use max_tokens
      requestBody.max_tokens = 500;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message;
  }
}

// Non-streaming agent for complex queries
export const runAgent = async (
  query: string,
  apiKey: string,
  model: OpenAIModel,
  tools: ToolDefinition[],
  sources?: Source[]
): Promise<string> => {
  const agent = new AIAgent(apiKey, model, tools);
  return await agent.run(query, sources);
};
