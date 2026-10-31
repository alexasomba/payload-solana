import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Payload Solana demo",
  description: "Try the Payload Solana plugin",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
