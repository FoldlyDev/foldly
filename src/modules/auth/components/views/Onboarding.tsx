"use client";
import { BubbleBackground } from "@/components/ui/animateui/bubble";
import { OnboardingForm } from "@/modules/auth";

export function OnboardingView() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <OnboardingForm />
    </div>
  );
}
