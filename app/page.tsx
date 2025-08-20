"use client";

import Image from "next/image";
import F1GPTLogo from "@/app/assets/logo.png";
import { useChat } from "ai/react";
import { Message } from "ai";
import PromptSuggestionRow from "./components/PromptSuggestionRow";
import LoadingBubble from "./components/LoadingBubble";
import Bubble from "./components/Bubble";

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

  const handlePrompt = (promptText) => {
    const msg: Message = {
        id: crypto.randomUUID(),
        content: promptText,
        role: "user"
    }
    append(msg)
  }

  return (
    <main>
      <Image src={F1GPTLogo} width={250} alt="F1 GPT Logo" />
      <section className={noMessages ? "" : "populated"}>
        {noMessages ? (
          <>
            <p className="starter-text">
              The Ultimate place for Formula One super fans! Ask F1GPT anything
              about the fantastic topic of F1 racing and it will come back with
              most up-to-date answers.
            </p>
            <br />
            <PromptSuggestionRow onPromptClick={handlePrompt} />
          </>
        ) : (
          <>
            {messages.map((message, index) => (
              <Bubble key={`message-${index}`} message={message} />
            ))}
            {isLoading && <LoadingBubble />}
          </>
        )}
      </section>

      <form onSubmit={handleSubmit}>
        <input
          className="question-box"
          onChange={handleInputChange}
          value={input}
          placeholder="Ask a question about F1..."
        />
        <input type="submit" />
      </form>
    </main>
  );
};

export default Home;
