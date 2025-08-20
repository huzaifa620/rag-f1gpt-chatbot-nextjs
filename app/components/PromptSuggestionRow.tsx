import PromptSuggestionButton from "./PromptSuggestionButton";

const PromptSuggestionsRow = ({
  onPromptClick,
}: {
  onPromptClick: (text: string) => void;
}) => {
  const prompts = [
    "Who is head of racing for Aston Martin's F1 Academy team?",
    "Who is the highest paid F1 driver?",
    "Who will be the newest driver for Ferrari?",
    "Who is the current Formula One World Driver's Champion?",
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {prompts.map((prompt, index) => (
        <PromptSuggestionButton
          key={`suggestion-${index}`}
          text={prompt}
          onClick={() => onPromptClick(prompt)}
        />
      ))}
    </div>
  );
};

export default PromptSuggestionsRow;
