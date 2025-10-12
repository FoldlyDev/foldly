"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useReverification } from "@clerk/nextjs";
import {
  isClerkRuntimeError,
  isReverificationCancelledError,
} from "@clerk/nextjs/errors";
import { Label, Input, MultiStepLoader } from "@/components/ui/aceternityui";
import { DynamicContentLoader } from "@/components/layout";
import {
  useCheckUsernameAvailability,
  useCompleteOnboarding,
} from "@/hooks";
import { sanitizeUsername } from "@/lib/utils/security";
import { cn } from "@/lib/utils";
import { SecondaryCtaButton } from "@/components/buttons";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/shadcn";
import Image from "next/image";

const loadingStates = [
  { text: "Checking username availability" },
  { text: "Creating your account and workspace" },
  { text: "Setting up your first link" },
  { text: "Finishing up final touches" },
];

// Helper function to add delay between steps
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function OnboardingForm() {
  const router = useRouter();
  const { user } = useUser();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Instantiate React Query hooks
  const checkUsernameMutation = useCheckUsernameAvailability();
  const completeOnboarding = useCompleteOnboarding();

  // Pre-fill username if user provided it during Clerk signup
  React.useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user?.username]);

  // Check if form is valid (matches validation in handleSubmit)
  const isFormValid = React.useMemo(() => {
    // Use sanitizeUsername to check if input is valid
    const sanitized = sanitizeUsername(username);

    // Must have at least 4 characters after sanitization
    if (!sanitized || sanitized.length < 4) return false;

    return true;
  }, [username]);

  // Wrap the checkUsernameAvailability hook with useReverification
  // This will automatically handle the reverification UI when needed
  const checkUsername = useReverification((username: string) =>
    checkUsernameMutation.mutateAsync(username)
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Sanitize username (client-side defense in depth)
    const sanitized = sanitizeUsername(username);

    // Basic validation
    if (!sanitized) {
      setError("Username is required");
      return;
    }

    if (sanitized.length < 4) {
      setError("Username must be at least 4 characters");
      return;
    }

    // Update state with sanitized version if different
    if (sanitized !== username.trim()) {
      setUsername(sanitized);
    }

    setLoading(true);

    try {
      // Show loader immediately
      setShowLoader(true);
      setLoading(false);

      // Step 0: Check if username is available in Clerk (with reverification)
      setCurrentStep(0);
      const availabilityCheck = await checkUsername(sanitized);

      // If user cancelled reverification, availabilityCheck will be null
      if (!availabilityCheck) {
        setError("Verification was cancelled");
        setShowLoader(false);
        return;
      }

      if (!availabilityCheck.success) {
        setError(availabilityCheck.message);
        setShowLoader(false);
        return;
      }

      if (!availabilityCheck.isAvailable) {
        setError("Username is already taken. Please choose another one.");
        setShowLoader(false);
        return;
      }

      await delay(1000); // Show step completion

      // Steps 1-3: Complete onboarding atomically (SEC-003: Transaction)
      // This creates user, workspace, link, and permission in a single database transaction
      // If ANY step fails, ALL steps are rolled back automatically
      setCurrentStep(1);

      const onboardingResult = await completeOnboarding.mutateAsync(sanitized);

      if (!onboardingResult.success) {
        throw new Error(onboardingResult.error || "Failed to complete onboarding");
      }

      await delay(1500); // Show transaction completion

      // Step 2: Visual feedback for link creation (already done in transaction)
      setCurrentStep(2);
      await delay(1000);

      // Step 3: Final touches (Clerk username already synced in transaction)
      setCurrentStep(3);
      await delay(1000);

      // Show warning if Clerk sync failed but onboarding succeeded
      if (onboardingResult.warning) {
        console.warn(onboardingResult.warning);
      }

      // All done! Redirect to dashboard
      router.push("/dashboard/workspace");
    } catch (e) {
      setShowLoader(false);
      // Handle if user cancels the reverification process
      if (isClerkRuntimeError(e) && isReverificationCancelledError(e)) {
        setError("Verification was cancelled. Please try again.");
        console.error("User cancelled reverification", e.code);
      } else {
        // Handle other errors
        setError("An unexpected error occurred. Please try again.");
        console.error("Onboarding error:", JSON.stringify(e, null, 2));
      }
      setLoading(false);
    }
  };

  return (
    <>
      {/* Multi-step loader overlay */}
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={showLoader}
        value={currentStep}
        loop={false}
      />

      {/* Onboarding form */}
      <AnimatePresence>
        {!showLoader && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-input mx-auto w-full max-w-md p-4 rounded-2xl md:p-8 foldly-glass-light dark:foldly-glass">
              <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 flex flex-row gap-2 items-center">
                <span>Yo{user?.firstName ? `, ${user.firstName}` : ""}!</span>
                <span>
                  <Image
                    src="https://em-content.zobj.net/source/animated-noto-color-emoji/427/smiling-face-with-sunglasses_1f60e.gif"
                    alt="Greenting emoji image"
                    width={40}
                    height={40}
                  />
                </span>
              </h2>
              <p className="max-w-sm text-md text-neutral-600 dark:text-neutral-300">
                We’re almost there. Drop your username and we’ll fire up your
                personal space in no time. Don’t worry, You can tweak it later.
              </p>

              <form
                className="my-8 gap-6 flex flex-col"
                onSubmit={handleSubmit}
              >
                <LabelInputContainer className="mb-4">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="johndoe"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                  />
                  {error && (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                      {error}
                    </p>
                  )}
                </LabelInputContainer>

                <div className="w-full flex items-center justify-center">
                  <SecondaryCtaButton
                    type="submit"
                    disabled={loading || !isFormValid}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <DynamicContentLoader
                          text=""
                          size="20"
                          speed="2"
                          color="white"
                        />
                      </div>
                    ) : (
                      <>Let's Roll!</>
                    )}
                  </SecondaryCtaButton>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
