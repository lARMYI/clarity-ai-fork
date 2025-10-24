import { OpenAIModel, ToolDefinition } from "@/types";
import { createParser, ParsedEvent, ReconnectInterval } from "eventsource-parser";

export const OpenAIStream = async (
  prompt: string,
  apiKey: string,
  model: OpenAIModel = OpenAIModel.GPT_5_MINI,
  tools?: ToolDefinition[],
  reasoningEffort?: "minimal" | "low" | "medium" | "high",
  verbosity?: "low" | "medium" | "high"
) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Check if this is a GPT-5 model (uses max_completion_tokens)
  const isGPT5 = model.startsWith("gpt-5");

  const requestBody: any = {
    model,
    messages: [
      { role: "system", content: "You are a helpful assistant that accurately answers the user's queries based on the given text. When you have access to tools, use them to provide more accurate and up-to-date information." },
      { role: "user", content: prompt }
    ],
    temperature: 0.0,
    stream: true
  };

  // GPT-5 uses max_completion_tokens, older models use max_tokens
  if (isGPT5) {
    // GPT-5 can output up to 128K tokens, but we'll use a reasonable default
    requestBody.max_completion_tokens = 4000;

    // GPT-5 specific parameters (use provided values or defaults)
    requestBody.reasoning_effort = reasoningEffort || "low"; // Options: minimal, low, medium, high
    requestBody.verbosity = verbosity || "medium"; // Options: low, medium, high
  } else {
    // Legacy models (GPT-3.5-turbo, GPT-4)
    requestBody.max_tokens = 500;
  }

  // Add tools if provided
  if (tools && tools.length > 0) {
    requestBody.tools = tools;
    requestBody.tool_choice = "auto";
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    method: "POST",
    body: JSON.stringify(requestBody)
  });

  if (res.status !== 200) {
    const errorText = await res.text();
    throw new Error(`OpenAI API returned an error: ${res.status} - ${errorText}`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === "event") {
          const data = event.data;

          if (data === "[DONE]") {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const delta = json.choices[0].delta;

            // Handle regular content
            if (delta.content) {
              const queue = encoder.encode(delta.content);
              controller.enqueue(queue);
            }

            // Handle tool calls
            if (delta.tool_calls) {
              const toolCall = delta.tool_calls[0];
              if (toolCall.function?.name) {
                const toolMessage = `\n[Using tool: ${toolCall.function.name}]\n`;
                controller.enqueue(encoder.encode(toolMessage));
              }
            }
          } catch (e) {
            // Silently skip parsing errors for partial chunks
            console.error('Parsing error:', e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    }
  });

  return stream;
};
