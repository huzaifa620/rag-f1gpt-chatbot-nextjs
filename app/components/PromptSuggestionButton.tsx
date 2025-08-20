const PromptSuggestionButton = ({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) => {
  return (
    <button
      className="rounded-xl bg-white p-3 text-xs text-neutral-700 shadow-sm ring-1 ring-black/5 transition hover:bg-gray-300 cursor-pointer active:scale-[0.98]"
      onClick={onClick}
      type="button"
    >
      {text}
    </button>
  );
};

export default PromptSuggestionButton;
