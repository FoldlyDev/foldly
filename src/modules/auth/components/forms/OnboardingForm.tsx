"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Label, Input } from "@/components/ui/shadcn";
import { DynamicContentLoader } from "@/components/layout";
import { createUserWorkspaceAction } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { PrimaryCtaButton } from "@/components/buttons";

export default function OnboardingForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
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
      const result = await createUserWorkspaceAction(username);

      if (result.success) {
        // Redirect to dashboard
        router.push("/dashboard/workspace");
      } else {
        setError(result.error || "Failed to create workspace");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shadow-input mx-auto w-full max-w-md rounded-none p-4 md:rounded-2xl md:p-8 foldly-glass-light dark:foldly-glass">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Welcome to Foldly!
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        Choose a username to complete your profile. Your workspace will be
        created automatically.
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
            autoFocus
            required
          />
          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 mt-1">
              {error}
            </p>
          )}
        </LabelInputContainer>

        <div className="w-full flex items-center justify-center">
          <PrimaryCtaButton type="submit" disabled={loading}>
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
              <>Let's Roll</>
            )}
          </PrimaryCtaButton>
        </div>
      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

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
