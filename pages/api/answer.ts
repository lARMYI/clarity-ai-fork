import { OpenAIStream } from "@/utils/answer";
import { OpenAIModel, ToolDefinition } from "@/types";
import { searchTools } from "@/utils/tools";

export const config = {
  runtime: "edge"
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { prompt, apiKey, model, useTools } = (await req.json()) as {
      prompt: string;
      apiKey: string;
      model?: OpenAIModel;
      useTools?: boolean;
    };

    // Default to GPT-5-mini if no model specified
    const selectedModel = model || OpenAIModel.GPT_5_MINI;

    // Enable tools if requested
    const tools = useTools ? searchTools : undefined;

    const stream = await OpenAIStream(prompt, apiKey, selectedModel, tools);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    return new Response(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
};

export default handler;
