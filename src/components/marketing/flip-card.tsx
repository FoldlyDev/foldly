import { forwardRef } from 'react';
import UseAnimations from 'react-useanimations';
import settings from 'react-useanimations/lib/settings';
import heart from 'react-useanimations/lib/heart';
import archive from 'react-useanimations/lib/archive';
import { Diamond } from '@/components/ui/core/diamond';

interface FlipCardProps {
  id: string;
  title: string;
  number: string;
  features: string[];
  className?: string;
  flipCardInnerRef?: React.RefObject<HTMLDivElement | null>;
  iconType?: 'settings' | 'heart' | 'archive';
}

export const FlipCard = forwardRef<HTMLDivElement, FlipCardProps>(
  (
    {
      id,
      title,
      number,
      features,
      className = '',
      flipCardInnerRef,
      iconType = 'settings',
    },
    ref
  ) => {
    // Get the appropriate animation based on iconType
    const getAnimation = () => {
      switch (iconType) {
        case 'heart':
          return heart;
        case 'archive':
          return archive;
        default:
          return settings;
      }
    };

    return (
      <div className={`card ${className}`} id={id} ref={ref}>
        <div className='card-wrapper'>
          <div className='flip-card-inner' ref={flipCardInnerRef}>
            <div className='flip-card-front'>
              {/* Corner Diamonds */}
              <div className='card-corner-icons'>
                <Diamond size={8} className='text-neutral-600' />
                <Diamond size={8} className='text-neutral-600' />
                <Diamond size={8} className='text-neutral-600' />
                <Diamond size={8} className='text-neutral-600' />
              </div>

              {/* Card Title Top */}
              <div className='card-title'>
                <span>{title}</span>
                <span>{number}</span>
              </div>

              {/* Animated Icon Center */}
              <div className='card-icon-center'>
                <UseAnimations
                  animation={getAnimation()}
                  size={48}
                  strokeColor='currentColor'
                  autoplay={false}
                  loop={false}
                />
              </div>

              {/* Card Title Bottom */}
              <div className='card-title'>
                <span>{number}</span>
                <span>{title}</span>
              </div>
            </div>
            <div className='flip-card-back'>
              <div className='card-title'>
                <span>{title}</span>
                <span>{number}</span>
              </div>
              <div className='card-copy'>
                {features.map((feature, index) => (
                  <p key={index}>{feature}</p>
                ))}
              </div>
              <div className='card-title'>
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

FlipCard.displayName = 'FlipCard';
