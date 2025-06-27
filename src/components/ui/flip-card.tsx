import { forwardRef } from "react";

interface FlipCardProps {
  id: string;
  title: string;
  number: string;
  features: string[];
  className?: string;
  flipCardInnerRef?: React.RefObject<HTMLDivElement | null>;
}

export const FlipCard = forwardRef<HTMLDivElement, FlipCardProps>(
  ({ id, title, number, features, className = "", flipCardInnerRef }, ref) => {
    return (
      <div className={`card ${className}`} id={id} ref={ref}>
        <div className="card-wrapper">
          <div className="flip-card-inner" ref={flipCardInnerRef}>
            <div className="flip-card-front">
              <div className="card-title">
                <span>{title}</span>
                <span>{number}</span>
              </div>
              <div className="card-title">
                <span>{number}</span>
                <span>{title}</span>
              </div>
            </div>
            <div className="flip-card-back">
              <div className="card-title">
                <span>{title}</span>
                <span>{number}</span>
              </div>
              <div className="card-copy">
                {features.map((feature, index) => (
                  <p key={index}>{feature}</p>
                ))}
              </div>
              <div className="card-title">
                <span>{number}</span>
                <span>{title}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

FlipCard.displayName = "FlipCard";
