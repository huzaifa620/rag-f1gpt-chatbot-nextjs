"use client";

import Image from "next/image";
import F1GPTLogo from "@/app/assets/logo.png";
import { useChat } from "ai/react";
import { Message } from "ai";
import PromptSuggestionRow from "./components/PromptSuggestionRow";
import LoadingBubble from "./components/LoadingBubble";
import Bubble from "./components/Bubble";
import { useState, useEffect, useRef } from "react";

const Home = () => {
  const {
    append,
    isLoading,
    messages,
    input,
    handleInputChange,
    handleSubmit,
  } = useChat({});
  const noMessages = !messages || messages.length === 0;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    setIsScrolled(scrollTop > 0);
  };

  const handlePrompt = (promptText: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      content: promptText,
      role: "user",
    };
    append(msg);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl rounded-2xl bg-gray-800/80 backdrop-blur-xl shadow-2xl ring-1 ring-gray-700/50 overflow-hidden">
        {/* Header with F1-inspired accent */}
        <div className="relative h-2 bg-gradient-to-r from-red-600 via-red-500 to-red-600">
          <div className="absolute inset-0 flex">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="h-full w-10 bg-black"
                style={{ marginLeft: i === 0 ? "0" : "20px" }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col p-6 md:p-8">
          {/* Logo section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-40 h-40 mb-2">
              <Image
                src={F1GPTLogo}
                fill
                alt="F1 GPT Logo"
                className="drop-shadow-lg object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1 tracking-wide">
              F1GPT
            </h1>
            <p className="text-sm text-gray-400 text-center max-w-md">
              The ultimate AI assistant for Formula One super fans
            </p>
          </div>

          {/* Chat area */}
          <section
            className={[
              "w-full transition-all duration-300 rounded-xl",
              noMessages
                ? "min-h-[200px]"
                : "flex flex-col justify-end overflow-y-auto max-h-[60vh] bg-gray-900/30 p-4 border border-gray-700/50",
            ].join(" ")}
            onScroll={handleScroll}
          >
            {noMessages ? (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-400 text-center text-sm mb-6 max-w-md">
                  Ask F1GPT anything about Formula 1 racing and get up-to-date
                  answers.
                </p>
                <PromptSuggestionRow onPromptClick={handlePrompt} />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((message, index) => (
                  <Bubble key={`message-${index}`} message={message} />
                ))}
                {isLoading && <LoadingBubble />}
                <div ref={messagesEndRef} />
              </div>
            )}
          </section>

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/30 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <input
                className="flex-1 rounded-xl border border-gray-600 bg-gray-700/40 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-400 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all"
                onChange={handleInputChange}
                value={input}
                placeholder="Ask a question about F1..."
                disabled={isLoading}
              />
              <button
                type="submit"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-red-700 hover:bg-red-500 px-4 py-3 text-sm font-medium text-white shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Send
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="ml-2 h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Home;
