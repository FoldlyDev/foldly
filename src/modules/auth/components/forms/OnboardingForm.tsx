"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useReverification } from "@clerk/nextjs";
import {
  isClerkRuntimeError,
  isReverificationCancelledError,
} from "@clerk/nextjs/errors";
import { Label, Input } from "@/components/ui/aceternityui";
import { DynamicContentLoader } from "@/components/layout";
import {
  createUserWorkspaceAction,
  checkUsernameAvailability,
} from "@/lib/actions";
import { cn } from "@/lib/utils";
import { SecondaryCtaButton } from "@/components/buttons";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/shadcn";
import Image from "next/image";

export default function OnboardingForm() {
  const router = useRouter();
  const { user } = useUser();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Wrap the checkUsernameAvailability with useReverification
  // This will automatically handle the reverification UI when needed
  const checkUsername = useReverification((username: string) =>
    checkUsernameAvailability(username)
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (username.length < 4) {
      setError("Username must be at least 4 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError(
        "Username can only contain letters, numbers, hyphens, and underscores"
      );
      return;
    }

    setLoading(true);

    try {
      // Check if username is available in Clerk (with reverification)
      const availabilityCheck = await checkUsername(username);

      // If user cancelled reverification, availabilityCheck will be null
      if (!availabilityCheck) {
        setError("Verification was cancelled");
        setLoading(false);
        return;
      }

      if (!availabilityCheck.success) {
        setError(availabilityCheck.message);
        setLoading(false);
        return;
      }

      if (!availabilityCheck.isAvailable) {
        setError("Username is already taken. Please choose another one.");
        setLoading(false);
        return;
      }

      // Username is available, proceed with workspace creation
      //   const result = await createUserWorkspaceAction(username);

      //   if (result.success) {
      //     // Redirect to dashboard
      //     router.push("/dashboard/workspace");
      //   } else {
      //     setError(result.error || "Failed to create workspace");
      //   }
    } catch (e) {
      // Handle if user cancels the reverification process
      if (isClerkRuntimeError(e) && isReverificationCancelledError(e)) {
        setError("Verification was cancelled. Please try again.");
        console.error("User cancelled reverification", e.code);
      } else {
        // Handle other errors
        setError("An unexpected error occurred");
        console.error("Onboarding error:", JSON.stringify(e, null, 2));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
          We’re almost there. Drop your username and we’ll fire up your personal
          space in no time. Don’t worry, You can tweak it later.
        </p>

        <form className="my-8 gap-6 flex flex-col" onSubmit={handleSubmit}>
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
            <SecondaryCtaButton type="submit" disabled={loading}>
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
