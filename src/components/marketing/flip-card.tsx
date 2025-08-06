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
        <div className='hero-card-inner'>
          <div className='card-title'>
            <p className='mono'>{title}</p>
            <p className='mono'>{number}</p>
          </div>
          <div className='card-title'>
            <p className='mono'>{number}</p>
            <p className='mono'>{title}</p>
          </div>
        </div>
      </div>
    );
  }
);

FlipCard.displayName = 'FlipCard';
