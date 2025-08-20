import "./global.css";

export const metaData = {
  title: "F1 GPT",
  description: "The place to go for all Formula 1 related information",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <title>{metaData.title}</title>
        <meta name="description" content={metaData.description} />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏎️</text></svg>"
        />
      </head>
      <body className="min-h-dvh bg-gradient-to-b from-neutral-50 to-neutral-200 text-neutral-800 antialiased">
        <div className="mx-auto w-full">{children}</div>
      </body>
    </html>
  );
};

export default RootLayout;
