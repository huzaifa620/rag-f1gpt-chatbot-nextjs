import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
  title: "F1 GPT",
  description: "The place to go for all Formula 1 related information",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏎️</text></svg>",
  },
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
