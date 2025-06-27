import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Foldly - File Collection Made Simple",
  description:
    "Create custom branded upload links and collect files from clients and collaborators with zero friction. No logins required.",
  keywords: [
    "file collection",
    "file sharing",
    "upload links",
    "file management",
    "collaboration",
  ],
  authors: [{ name: "Foldly Team" }],
  creator: "Foldly",
  publisher: "Foldly",
  openGraph: {
    title: "Foldly - File Collection Made Simple",
    description:
      "Create custom branded upload links and collect files from clients and collaborators with zero friction.",
    type: "website",
    locale: "en_US",
    siteName: "Foldly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Foldly - File Collection Made Simple",
    description:
      "Create custom branded upload links and collect files from clients and collaborators with zero friction.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
