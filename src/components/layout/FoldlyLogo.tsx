import { forwardRef } from 'react';

export const FoldlyLogo = forwardRef<SVGSVGElement>((props, ref) => {
  return (
    <svg
      ref={ref}
      width="160"
      height="160"
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Foldly "F" logo - single path for clean animation */}
      <path
        d="M40 30 L40 130 L50 130 L50 85 L80 85 L80 75 L50 75 L50 40 L90 40 L90 30 L40 30 Z M65 30 L65 50 L75 50 L90 50 L90 40 L75 40 L75 30 L65 30 Z M95 45 L105 55 L95 65 L95 60 L100 55 L95 50 L95 45 Z"
        fill="none"
        stroke="#e3e4d8"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

FoldlyLogo.displayName = 'FoldlyLogo';