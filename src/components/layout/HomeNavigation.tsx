"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser, UserButton } from "@clerk/nextjs";
import { LayoutDashboard } from "lucide-react";
import { TertiaryCtaButton } from "@/components/buttons/TertiaryCtaButton";
import { useScrollPosition } from "@/hooks";
import { cn } from "@/lib/utils";

export function Navigation() {
  const { isSignedIn, isLoaded } = useUser();
  const { isScrolled } = useScrollPosition({ threshold: 20 });

  // Don't render until user state is loaded to prevent flash
  if (!isLoaded) return null;

  return (
    <nav
      className={cn(
        "fixed w-full flex justify-between items-center z-[100] transition-all duration-300 ease-out",
        // Mobile-first responsive design
        "px-4 py-3", // Mobile: smaller padding
        "sm:px-6 sm:py-4", // Small screens: medium padding
        "lg:px-8", // Large screens: larger horizontal padding
        isScrolled
          ? "bg-transparent backdrop-blur-md shadow-lg shadow-black/5 lg:py-3"
          : "bg-transparent lg:py-6" // Less vertical padding on desktop when scrolled
      )}
    >
      <div className="logo">
        <Image
          src="/assets/img/logo/foldly_logo_sm.png"
          alt="Foldly"
          width={180}
          height={60}
          className={cn(
            "w-auto transition-all duration-300",
            // Responsive logo sizing
            "h-10 sm:h-12 lg:h-16"
          )}
          priority
        />
      </div>

      <div className="nav-links flex items-center gap-2 sm:gap-3 lg:gap-4">
        {isSignedIn ? (
          // Signed in: Show dashboard button + user button
          <>
            <Link href="/dashboard/workspace" className="no-underline">
              <TertiaryCtaButton
                className={cn(
                  // Responsive button styling
                  "px-3 py-2 text-xs",
                  "sm:px-4 sm:py-2 sm:text-sm",
                  "lg:px-4 lg:py-2 lg:text-sm"
                )}
              >
                <LayoutDashboard className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Dash</span>
              </TertiaryCtaButton>
            </Link>
            <div className="flex items-center">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: cn(
                      "cursor-pointer transition-all",
                      "w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
                    ),
                  },
                }}
              />
            </div>
          </>
        ) : (
          // Signed out: Show sign in button
          <Link href="/sign-in" className="no-underline">
            <TertiaryCtaButton
              className={cn(
                // Responsive button styling
                "px-3 py-2 text-xs",
                "sm:px-4 sm:py-2 sm:text-sm",
                "lg:px-4 lg:py-2 lg:text-sm"
              )}
            >
              Sign In
            </TertiaryCtaButton>
          </Link>
        )}
      </div>
    </nav>
  );
}
