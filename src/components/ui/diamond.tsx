interface DiamondProps {
  size?: number;
  className?: string;
  filled?: boolean;
  variant?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "quaternary"
    | "quinary"
    | "neutral";
}

export function Diamond({
  size = 12,
  className,
  filled = false,
  variant = "neutral",
}: DiamondProps) {
  const getVariantStyles = () => {
    const baseStyles = "transition-colors duration-200";

    if (!filled) {
      // Outline variants
      switch (variant) {
        case "primary":
          return `${baseStyles} stroke-[var(--primary)] fill-none`;
        case "secondary":
          return `${baseStyles} stroke-[var(--secondary)] fill-none`;
        case "tertiary":
          return `${baseStyles} stroke-[var(--tertiary)] fill-none`;
        case "quaternary":
          return `${baseStyles} stroke-[var(--quaternary)] fill-none`;
        case "quinary":
          return `${baseStyles} stroke-[var(--quinary)] fill-none`;
        default:
          return `${baseStyles} stroke-current fill-none`;
      }
    } else {
      // Filled variants
      switch (variant) {
        case "primary":
          return `${baseStyles} fill-[var(--primary)] stroke-[var(--primary-dark)]`;
        case "secondary":
          return `${baseStyles} fill-[var(--secondary)] stroke-[var(--secondary-dark)]`;
        case "tertiary":
          return `${baseStyles} fill-[var(--tertiary)] stroke-[var(--tertiary-dark)]`;
        case "quaternary":
          return `${baseStyles} fill-[var(--quaternary)] stroke-[var(--quaternary-dark)]`;
        case "quinary":
          return `${baseStyles} fill-[var(--quinary)] stroke-[var(--quinary-dark)]`;
        default:
          return `${baseStyles} fill-current stroke-current`;
      }
    }
  };

  const combinedClassName = [getVariantStyles(), className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={combinedClassName}
      strokeWidth={filled ? 1 : 2}
    >
      <path d="M12 2L22 12L12 22L2 12L12 2Z" />
    </svg>
  );
}
