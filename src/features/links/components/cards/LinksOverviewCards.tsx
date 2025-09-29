'use client';

import { motion } from 'framer-motion';
import { Link2, Eye, Upload, TrendingUp, Files } from 'lucide-react';
import { METRICS_LABELS } from '../../lib/constants';

interface LinksOverviewCardsProps {
  data?: {
    totalLinks: number;
    activeLinks: number;
    totalUploads: number;
    totalViews: number;
  };
}

type ColorType = 'primary' | 'secondary' | 'tertiary' | 'success';

export function LinksOverviewCards({ data }: LinksOverviewCardsProps) {
  // Provide default values when data is undefined - minimal fix for crash
  const safeData = data || {
    totalLinks: 0,
    activeLinks: 0,
    totalUploads: 0,
    totalViews: 0,
  };
  const cards = [
    {
      title: METRICS_LABELS.totalLinks,
      value: safeData.totalLinks,
      icon: Link2,
      color: 'primary' as ColorType,
    },
    {
      title: METRICS_LABELS.activeLinks,
      value: safeData.activeLinks,
      icon: TrendingUp,
      color: 'success' as ColorType,
    },
    {
      title: METRICS_LABELS.totalUploads,
      value: safeData.totalUploads,
      icon: Upload,
      color: 'secondary' as ColorType,
    },
    {
      title: 'Total Files',
      value: safeData.totalViews, // This actually contains totalFiles count
      icon: Files,
      color: 'tertiary' as ColorType,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='visible'
      className='overview-cards-grid'
    >
      {cards.map((card, index) => {
        const IconComponent = card.icon;

        return (
          <motion.div
            key={card.title}
            variants={cardVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`overview-card overview-card--${card.color} group`}
          >
            <div className='overview-card-content'>
              {/* Icon */}
              <div className='overview-card-icon'>
                <IconComponent />
              </div>

              {/* Value */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                className='overview-card-value'
              >
                {(isNaN(card.value) ? 0 : card.value).toLocaleString()}
              </motion.div>

              {/* Title */}
              <h3 className='overview-card-title'>
                {card.title}
              </h3>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
