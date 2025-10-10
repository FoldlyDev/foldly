"use client";

import { DotStream } from "ldrs/react";

export type LoaderType = "dotstream";

export interface DynamicContentLoaderProps {
  text?: string;
  loaderType?: LoaderType;
  size?: string;
  speed?: string;
  color?: string;
}

export function DynamicContentLoader({
  text = "Loading...",
  loaderType = "dotstream",
  size = "60",
  speed = "2.5",
  color = "white",
}: DynamicContentLoaderProps) {
  const renderLoader = () => {
    switch (loaderType) {
      case "dotstream":
      default:
        return <DotStream size={size} speed={speed} color={color} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {renderLoader()}
      {text && (
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          {text}
        </p>
      )}
    </div>
  );
}
