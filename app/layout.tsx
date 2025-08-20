import "./global.css";

export const metaData = {
  title: "F1 GPT",
  description: "The place to go for all Formula 1 related information",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-gradient-to-b from-neutral-50 to-neutral-200 text-neutral-800 antialiased">
        <div className="mx-auto w-full">{children}</div>
      </body>
    </html>
  );
};

export default RootLayout;
