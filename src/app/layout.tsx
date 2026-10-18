import type { Metadata } from "next";
import { Geist_Mono, Pixelify_Sans } from "next/font/google";
import { t } from "@/i18n";
import "./globals.css";

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pixel = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: t.shell.meta.title,
  description: t.shell.meta.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${mono.variable} ${pixel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
