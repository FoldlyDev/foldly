'use client';

import { motion } from 'framer-motion';
import {
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  QrCode,
  Mail,
  Share2,
  Copy,
  ExternalLink,
  Smartphone,
  Monitor,
  Crown,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/animate-ui/radix/dialog';
import { CopyButton } from '@/components/core/copy-button';
import { useCurrentModal, useModalData, useModalStore } from '../../store';
import { useLinkUrl } from '../../hooks/use-link-url';
// TODO: Replace with actual user plan fetching from user metadata

export function ShareModal() {
  const currentModal = useCurrentModal();
  const { link } = useModalData();
  const { closeModal } = useModalStore();
  // TODO: Get plan from user metadata
  const isPro = false;
  const isBusiness = false;

  const isOpen = currentModal === 'share-link';

  if (!isOpen || !link) return null;

  const { displayUrl, fullUrl } = useLinkUrl(link.slug, link.topic);
  const shareText = `Check out this file collection: ${link.title}`;
  const hasQrCodeAccess = isPro || isBusiness;

  const socialShareLinks = [
    {
      name: 'X (Twitter)',
      icon: Twitter,
      url: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`,
      color: 'text-foreground',
      bgColor: 'bg-muted/50 hover:bg-muted',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}&quote=${encodeURIComponent(shareText)}`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}&summary=${encodeURIComponent(shareText)}`,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
    },
  ];

  const handleSocialShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent
        className='w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-lg lg:max-w-3xl h-[90vh] sm:h-[85vh] md:h-[80vh] max-h-[90vh] p-0 overflow-hidden flex flex-col'
        from='bottom'
        transition={{ type: 'spring', stiffness: 180, damping: 25 }}
      >
        {/* Accessibility Labels */}
        <DialogTitle className='sr-only'>
          Share Collection Link: {link.title}
        </DialogTitle>
        <DialogDescription className='sr-only'>
          Share your collection link with others so they can upload files to{' '}
          {link.title}
        </DialogDescription>

        {/* Modal Header */}
        <div className='modal-header relative shrink-0'>
          <div className='p-4 sm:p-6 lg:p-8'>
            <div className='flex items-center gap-3 sm:gap-4'>
              <div className='p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg'>
                <Share2 className='w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground' />
              </div>
              <div className='min-w-0 flex-1'>
                <h1 className='text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate'>
                  Share Collection Link
                </h1>
                <p className='text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block'>
                  Get your link in front of the right people
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className='flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6'>
          {/* URL Copy Section */}
          <motion.div
            className='overview-card'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className='flex items-center gap-3 mb-4'>
              <div className='p-2 rounded-xl bg-muted/50'>
                <Copy className='w-5 h-5 text-muted-foreground' />
              </div>
              <h3 className='text-xl font-bold text-foreground'>Quick Copy</h3>
            </div>

            <div className='flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-border/50'>
              <code className='flex-1 text-sm font-mono text-foreground break-all'>
                {displayUrl}
              </code>
              <CopyButton
                value={fullUrl}
                size='sm'
                showText
                variant='default'
                className='premium-button text-white border-0 px-4 py-2 flex-shrink-0'
              />
            </div>

            <div className='flex items-center gap-4 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50'>
              <button
                onClick={() => window.open(fullUrl, '_blank')}
                className='flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors text-sm font-medium text-foreground cursor-pointer'
              >
                <ExternalLink className='w-4 h-4' />
                Open Link
              </button>
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <Monitor className='w-4 h-4' />
                <span>Works on all devices</span>
              </div>
            </div>
          </motion.div>

          {/* Social Media Sharing Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className='flex items-center gap-3 mb-6'>
              <div className='p-2 rounded-xl bg-blue-500/10'>
                <Smartphone className='w-5 h-5 text-blue-600' />
              </div>
              <h3 className='text-xl font-bold text-foreground'>
                Share on Social
              </h3>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
              {socialShareLinks.map((social, index) => (
                <motion.button
                  key={social.name}
                  onClick={() => handleSocialShare(social.url)}
                  className='overview-card group cursor-pointer'
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className='flex flex-col items-center space-y-3'>
                    <div
                      className={`p-3 rounded-2xl ${social.bgColor} group-hover:scale-110 transition-transform duration-200`}
                    >
                      <social.icon className={`w-6 h-6 ${social.color}`} />
                    </div>
                    <span className='font-medium text-foreground text-sm'>
                      {social.name}
                    </span>
                  </div>
                </motion.button>
              ))}

              {/* Email Share */}
              <motion.button
                onClick={() => {
                  const emailSubject = encodeURIComponent(
                    `File Collection: ${link.title}`
                  );
                  const emailBody = encodeURIComponent(
                    `Hi there!\n\nI'd like to share this file collection with you: ${link.title}\n\nYou can upload files here: ${fullUrl}\n\nThanks!`
                  );
                  window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
                }}
                className='overview-card group cursor-pointer'
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className='flex flex-col items-center space-y-3'>
                  <div className='p-3 rounded-2xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 group-hover:scale-110 transition-all duration-200'>
                    <Mail className='w-6 h-6 text-red-600 dark:text-red-400' />
                  </div>
                  <span className='font-medium text-foreground text-sm'>
                    Email
                  </span>
                </div>
              </motion.button>

              {/* QR Code - Pro Feature */}
              {hasQrCodeAccess ? (
                <motion.button
                  onClick={() => {
                    // TODO: Implement QR code generation logic
                    console.log('Generate QR code for:', fullUrl);
                  }}
                  className='overview-card group cursor-pointer'
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className='flex flex-col items-center space-y-3'>
                    <div className='p-3 rounded-2xl bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 group-hover:scale-110 transition-all duration-200'>
                      <QrCode className='w-6 h-6 text-purple-600 dark:text-purple-400' />
                    </div>
                    <span className='font-medium text-foreground text-sm'>
                      QR Code
                    </span>
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  className='overview-card cursor-not-allowed relative overflow-hidden'
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className='absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-primary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1'>
                    <Crown className='w-3 h-3' />
                    PRO
                  </div>
                  <div className='flex flex-col items-center space-y-3 opacity-50'>
                    <div className='p-3 rounded-2xl bg-purple-50 dark:bg-purple-500/10'>
                      <QrCode className='w-6 h-6 text-purple-600 dark:text-purple-400' />
                    </div>
                    <span className='font-medium text-muted-foreground text-sm'>
                      QR Code
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      Upgrade to Pro
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
