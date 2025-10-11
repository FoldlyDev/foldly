import type { Metadata } from "next";
import { BubbleBackground } from "@/components/ui/animateui/bubble";

import "@/modules/auth/styles/shared/auth.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Foldly Authentication",
    default: "Sign In | Foldly",
  },
  description: "Secure authentication for your file collection platform",
  robots: {
    index: false, // Don't index auth pages
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden p-4 sm:p-6 md:p-8">
      <BubbleBackground />
      {children}
    </div>
  );
}
