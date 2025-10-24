# GPT-5 Features & Upgrade Guide

This document describes the GPT-5 model integration and new features added to Clarity AI.

## Overview

Clarity AI has been upgraded to support OpenAI's GPT-5 family of models, including:
- **GPT-5** - The most capable model with advanced reasoning
- **GPT-5 Mini** - Balanced performance and cost (default)
- **GPT-5 Nano** - Fastest and most cost-effective
- **GPT-3.5 Turbo** - Legacy model support

## New Features

### 1. Model Selection

Users can now choose from multiple GPT models based on their needs:

- **GPT-5**: Best for complex queries requiring deep reasoning
  - Pricing: $1.25/1M input tokens, $10/1M output tokens
  - Context: 400,000 tokens
  - ~45% fewer factual errors than GPT-4o

- **GPT-5 Mini**: Balanced option (default)
  - Pricing: $0.25/1M input tokens, $2/1M output tokens
  - Context: 400,000 tokens
  - Great balance of speed and capability

- **GPT-5 Nano**: Fastest and cheapest
  - Pricing: $0.05/1M input tokens, $0.40/1M output tokens
  - Context: 400,000 tokens
  - Ideal for simple queries

### 2. Agent Mode (Tool Calling)

Enable AI agents with tool-calling capabilities for:
- More accurate information retrieval
- Multi-step reasoning
- Better source analysis
- Enhanced factual accuracy

When Agent Mode is enabled, the AI can:
- Search the web intelligently
- Analyze multiple sources
- Get current date/time information
- Synthesize information from multiple perspectives

### 3. Enhanced API Structure

The application now uses OpenAI's latest GPT-5 API features:
- **max_completion_tokens** instead of max_tokens (GPT-5 requirement)
- **reasoning_effort** parameter for controlling thinking depth (minimal, low, medium, high)
- **verbosity** parameter for controlling output length (low, medium, high)
- **Streaming responses** for real-time answers
- **Tool calling** for enhanced capabilities
- **Improved error handling** with detailed error messages
- **Flexible model selection** via API

**Important:** GPT-5 models will error if you use `max_tokens` - they require `max_completion_tokens` instead. Legacy models (GPT-3.5) still use `max_tokens`.

## How to Use

### Configure Settings

1. Click "Show Settings"
2. Enter your OpenAI API key (51 characters)
3. Select your preferred model:
   - GPT-5 for maximum capability
   - GPT-5 Mini for balanced performance (recommended)
   - GPT-5 Nano for speed
4. Toggle "Enable Agent Mode" for tool calling
5. Click "Save"

### Model Selection Guide

Choose your model based on:

| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| Complex analysis | GPT-5 | Best reasoning capabilities |
| General questions | GPT-5 Mini | Best balance |
| Quick lookups | GPT-5 Nano | Fastest response |
| Cost optimization | GPT-5 Nano | Lowest cost |

### Agent Mode

**When to enable Agent Mode:**
- Queries requiring current information
- Multi-step reasoning tasks
- Fact-checking critical information
- Complex research questions

**When to disable Agent Mode:**
- Simple queries
- When sources are sufficient
- Speed is priority
- Cost optimization

## Technical Implementation

### Files Modified

1. **types/index.ts** - Added GPT-5 model enums and tool definitions
2. **utils/answer.ts** - Updated to support model selection and tool calling
3. **utils/tools.ts** - New file defining available tools
4. **utils/agent.ts** - New AI agent implementation with multi-step reasoning
5. **pages/api/answer.ts** - Enhanced API endpoint with model and tool support
6. **components/Search.tsx** - Added UI for model selection and agent mode

### API Changes

The `/api/answer` endpoint now accepts:
```typescript
{
  prompt: string;
  apiKey: string;
  model?: OpenAIModel;  // New: Model selection
  useTools?: boolean;   // New: Enable agent mode
  reasoningEffort?: "minimal" | "low" | "medium" | "high";  // GPT-5 only
  verbosity?: "low" | "medium" | "high";  // GPT-5 only
}
```

**Token Parameters:**
- GPT-5 models use: `max_completion_tokens` (up to 128K)
- Legacy models use: `max_tokens`
- The API automatically selects the correct parameter based on the model

### Tool Definitions

Three tools are currently available:
1. **search_web** - Search for current information
2. **get_current_date** - Get current date/time
3. **analyze_sources** - Synthesize information from sources

## Migration Guide

Existing users will:
- Default to GPT-5 Mini (best balance)
- Have Agent Mode enabled by default
- Keep their existing API keys
- See the current model in the UI

No breaking changes - all existing functionality is preserved.

## Performance

### GPT-5 Improvements
- 45% fewer factual errors vs GPT-4o
- 400,000 token context window (vs 128,000)
- Faster inference times
- Better citation accuracy

### Agent Mode Impact
- Slightly slower due to tool calls
- Higher accuracy for complex queries
- Better source integration
- More reliable factual information

## Future Enhancements

Potential improvements:
- [ ] Custom tool definitions
- [ ] More specialized agents
- [ ] GPT-5 "thinking" mode integration
- [ ] Advanced grammar constraints (CFG)
- [ ] Free-form tool calling
- [ ] Multi-agent collaboration

## Pricing Comparison

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| GPT-5 | $1.25 | $10.00 |
| GPT-5 Mini | $0.25 | $2.00 |
| GPT-5 Nano | $0.05 | $0.40 |
| GPT-3.5 Turbo | ~$0.50 | ~$1.50 |

## Support

For issues or questions:
1. Check the OpenAI API documentation
2. Review this guide
3. Check console logs for errors
4. Verify API key is valid
5. Ensure model is available in your region

## References

- [OpenAI GPT-5 Announcement](https://openai.com/index/introducing-gpt-5/)
- [GPT-5 System Card](https://openai.com/index/gpt-5-system-card/)
- [GPT-5 Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI API Documentation](https://platform.openai.com/docs)
