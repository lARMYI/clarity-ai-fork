import { SearchQuery, Source, OpenAIModel } from "@/types";
import { IconArrowRight, IconBolt, IconSearch, IconRobot } from "@tabler/icons-react";
import endent from "endent";
import { FC, KeyboardEvent, useEffect, useRef, useState } from "react";

interface SearchProps {
  onSearch: (searchResult: SearchQuery) => void;
  onAnswerUpdate: (answer: string) => void;
  onDone: (done: boolean) => void;
}

export const Search: FC<SearchProps> = ({ onSearch, onAnswerUpdate, onDone }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<OpenAIModel>(OpenAIModel.GPT_5_MINI);
  const [useAgentMode, setUseAgentMode] = useState<boolean>(true);

  const handleSearch = async () => {
    if (!query) {
      alert("Please enter a query");
      return;
    }

    setLoading(true);
    const sources = await fetchSources();
    await handleStream(sources);
  };

  const fetchSources = async () => {
    const response = await fetch("/api/sources", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      setLoading(false);
      throw new Error(response.statusText);
    }

    const { sources }: { sources: Source[] } = await response.json();

    return sources;
  };

  const handleStream = async (sources: Source[]) => {
    try {
      const prompt = endent`Provide a 2-3 sentence answer to the query based on the following sources. Be original, concise, accurate, and helpful. Cite sources as [1] or [2] or [3] after each sentence (not just the very end) to back up your answer (Ex: Correct: [1], Correct: [2][3], Incorrect: [1, 2]).

      ${sources.map((source, idx) => `Source [${idx + 1}]:\n${source.text}`).join("\n\n")}
      `;

      const response = await fetch("/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt,
          apiKey,
          model: selectedModel,
          useTools: useAgentMode
        })
      });

      if (!response.ok) {
        setLoading(false);
        throw new Error(response.statusText);
      }

      setLoading(false);
      onSearch({ query, sourceLinks: sources.map((source) => source.url) });

      const data = response.body;

      if (!data) {
        return;
      }

      const reader = data.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        onAnswerUpdate(chunkValue);
      }

      onDone(true);
    } catch (err) {
      onAnswerUpdate("Error");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSave = () => {
    if (apiKey.length !== 51) {
      alert("Please enter a valid API key.");
      return;
    }

    localStorage.setItem("CLARITY_KEY", apiKey);
    localStorage.setItem("CLARITY_MODEL", selectedModel);
    localStorage.setItem("CLARITY_AGENT_MODE", String(useAgentMode));

    setShowSettings(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    localStorage.removeItem("CLARITY_KEY");

    setApiKey("");
  };

  useEffect(() => {
    const CLARITY_KEY = localStorage.getItem("CLARITY_KEY");
    const CLARITY_MODEL = localStorage.getItem("CLARITY_MODEL");
    const CLARITY_AGENT_MODE = localStorage.getItem("CLARITY_AGENT_MODE");

    if (CLARITY_KEY) {
      setApiKey(CLARITY_KEY);
    } else {
      setShowSettings(true);
    }

    if (CLARITY_MODEL) {
      setSelectedModel(CLARITY_MODEL as OpenAIModel);
    }

    if (CLARITY_AGENT_MODE !== null) {
      setUseAgentMode(CLARITY_AGENT_MODE === "true");
    }

    inputRef.current?.focus();
  }, []);

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center pt-64 sm:pt-72 flex-col">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <div className="mt-8 text-2xl">Getting answer...</div>
        </div>
      ) : (
        <div className="mx-auto flex h-full w-full max-w-[750px] flex-col items-center space-y-6 px-3 pt-32 sm:pt-64">
          <div className="flex items-center">
            <IconBolt size={36} />
            <div className="ml-1 text-center text-4xl">Clarity</div>
          </div>

          {apiKey.length === 51 ? (
            <>
              <div className="relative w-full">
                <IconSearch className="text=[#D4D4D8] absolute top-3 w-10 left-1 h-6 rounded-full opacity-50 sm:left-3 sm:top-4 sm:h-8" />

                <input
                  ref={inputRef}
                  className="h-12 w-full rounded-full border border-zinc-600 bg-[#2A2A31] pr-12 pl-11 focus:border-zinc-800 focus:bg-[#18181C] focus:outline-none focus:ring-2 focus:ring-zinc-800 sm:h-16 sm:py-2 sm:pr-16 sm:pl-16 sm:text-lg"
                  type="text"
                  placeholder="Ask anything..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />

                <button>
                  <IconArrowRight
                    onClick={handleSearch}
                    className="absolute right-2 top-2.5 h-7 w-7 rounded-full bg-blue-500 p-1 hover:cursor-pointer hover:bg-blue-600 sm:right-3 sm:top-3 sm:h-10 sm:w-10"
                  />
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#A1A1AA]">
                <span className="flex items-center gap-1">
                  <span className="text-[#D4D4D8]">Model:</span>
                  {selectedModel === OpenAIModel.GPT_5 && "GPT-5"}
                  {selectedModel === OpenAIModel.GPT_5_MINI && "GPT-5 Mini"}
                  {selectedModel === OpenAIModel.GPT_5_NANO && "GPT-5 Nano"}
                  {selectedModel === OpenAIModel.DAVINCI_TURBO && "GPT-3.5 Turbo"}
                </span>
                {useAgentMode && (
                  <span className="flex items-center gap-1 text-green-400">
                    <IconRobot size={14} />
                    Agent Mode
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="text-center text-[#D4D4D8]">Please enter your OpenAI API key.</div>
          )}

          <button
            className="flex cursor-pointer items-center space-x-2 rounded-full border border-zinc-600 px-3 py-1 text-sm text-[#D4D4D8] hover:text-white"
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? "Hide" : "Show"} Settings
          </button>

          {showSettings && (
            <>
              <input
                type="password"
                className="max-w-[400px] block w-full rounded-md border border-gray-300 p-2 text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);

                  if (e.target.value.length !== 51) {
                    setShowSettings(true);
                  }
                }}
                placeholder="Enter OpenAI API Key"
              />

              <div className="w-full max-w-[400px] space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#D4D4D8] mb-2">
                    Model Selection
                  </label>
                  <select
                    className="block w-full rounded-md border border-gray-300 p-2 text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value as OpenAIModel)}
                  >
                    <option value={OpenAIModel.GPT_5}>GPT-5 (Most Capable)</option>
                    <option value={OpenAIModel.GPT_5_MINI}>GPT-5 Mini (Balanced)</option>
                    <option value={OpenAIModel.GPT_5_NANO}>GPT-5 Nano (Fastest)</option>
                    <option value={OpenAIModel.DAVINCI_TURBO}>GPT-3.5 Turbo (Legacy)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="agentMode"
                    checked={useAgentMode}
                    onChange={(e) => setUseAgentMode(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="agentMode" className="flex items-center text-sm text-[#D4D4D8] cursor-pointer">
                    <IconRobot className="mr-1" size={18} />
                    Enable Agent Mode (Tool Calling)
                  </label>
                </div>

                <div className="text-xs text-[#A1A1AA]">
                  Agent mode enables the AI to use tools for better accuracy and up-to-date information.
                </div>
              </div>

              <div className="flex space-x-2">
                <div
                  className="flex cursor-pointer items-center space-x-2 rounded-full border border-zinc-600 bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                  onClick={handleSave}
                >
                  Save
                </div>

                <div
                  className="flex cursor-pointer items-center space-x-2 rounded-full border border-zinc-600 bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                  onClick={handleClear}
                >
                  Clear
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
