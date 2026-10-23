import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AVTub Stream & Real Downloader - HD Video Player",
  description: "Real live stream extractor, HLS m3u8 decryptor, and fast video downloader.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen antialiased selection:bg-zinc-700 selection:text-white">
        {children}
      </body>
    </html>
  );
}
