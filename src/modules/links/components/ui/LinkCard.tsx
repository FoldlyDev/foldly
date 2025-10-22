import React from "react";
import { DottedGlowBackground } from "@/components/ui/aceternityui";
import { TertiaryCtaButton } from "@/components/buttons/TertiaryCtaButton";
import { MoreVertical } from "lucide-react";
import type { Link } from "@/lib/database/schemas";

interface LinkCardProps {
  link: Link;
}

export function LinkCard({ link }: LinkCardProps) {
  return (
    <div className="relative flex size-60 items-end justify-end overflow-hidden rounded-md rounded-tl-3xl rounded-br-3xl rounded-bl-3xl border border-transparent px-4 shadow ring-1 shadow-black/10 ring-black/5 md:size-100 dark:shadow-white/10 dark:ring-white/5">
      <h1 className="absolute inset-0 z-20 m-auto text-center flex items-center justify-center font-semibold text-lg">
        <span className="foldly-glass p-4 rounded-3xl">{link.name}</span>
      </h1>
      <div className="relative z-20 flex w-full justify-between px-2 py-3 backdrop-blur-[2px] md:px-4">
        <p className="text-xs font-normal text-neutral-600 md:text-sm dark:text-neutral-400">
          {link.linkConfig.customMessage || ""}
        </p>
        <TertiaryCtaButton className="p-1">
          <MoreVertical className="size-4" />
        </TertiaryCtaButton>
      </div>
      <DottedGlowBackground
        className="pointer-events-none mask-radial-to-90% mask-radial-at-center"
        opacity={1}
        gap={10}
        radius={1.6}
        colorLightVar="--color-neutral-500"
        glowColorLightVar="--color-neutral-600"
        colorDarkVar="--color-neutral-500"
        glowColorDarkVar="--color-sky-800"
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={1.6}
        speedScale={1}
      />
    </div>
  );
}
