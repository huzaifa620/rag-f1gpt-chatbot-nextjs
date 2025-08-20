const Bubble = ({
  message,
}: {
  message: { content: string; role: string };
}) => {
  const base =
    "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ring-1 ring-black/5";
  const asst = "self-start rounded-bl-sm bg-indigo-50 text-neutral-800";
  const user = "self-end rounded-br-sm bg-neutral-900 border border-white/30 text-white";

  return (
    <div
      className={`mx-2 my-1 ${
        message.role === "user" ? "flex justify-end" : "flex justify-start"
      }`}
    >
      <div className={`${base} ${message.role === "user" ? user : asst}`}>
        {message.content}
      </div>
    </div>
  );
};

export default Bubble;
