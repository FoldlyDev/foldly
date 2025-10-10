"use client";

import { ClerkLoaded, ClerkLoading, SignIn } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import { BubbleBackground } from "@/components/ui/animateui/bubble";
import { useEffect, useState } from "react";
import { DynamicContentLoader } from "@/components/layout";

export function SignInView() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="auth-page flex flex-col items-center justify-center">
        <BubbleBackground />

        {/* Back button */}
        <a href="/" className="auth-back-button" aria-label="Back to home">
          <ArrowLeft className="w-5 h-5" />
          Back
        </a>
      </div>
    );
  }

  return (
    <div className="auth-page flex flex-col items-center justify-center">
      <BubbleBackground />

      {/* Back button */}
      <a href="/" className="auth-back-button" aria-label="Back to home">
        <ArrowLeft className="w-5 h-5" />
        Back
      </a>

      {/* Loading state */}
      <ClerkLoading>
        <div className="flex flex-col items-center justify-center gap-6 p-8 foldly-glass rounded-2xl shadow-xl max-w-md w-full relative z-10">
          <DynamicContentLoader loaderType="dotstream" text="Loading" />
        </div>
      </ClerkLoading>

      {/* Auth modal */}
      <ClerkLoaded>
        <div className="auth-card-container">
          <SignIn />
        </div>
      </ClerkLoaded>
    </div>
  );
}
