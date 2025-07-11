'use client';

import {
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  QrCode,
  Mail,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/animate-ui/radix/dialog';
import { CopyButton } from '@/components/ui/copy-button';
import { ActionButton } from '@/components/ui/action-button';
import { useCurrentModal, useModalData, useModalStore } from '../../store';

export function ShareModal() {
  const currentModal = useCurrentModal();
  const { link } = useModalData();
  const { closeModal } = useModalStore();

  const isOpen = currentModal === 'share-link';

  if (!isOpen || !link) return null;

  const linkUrl = `foldly.com/${link.slug}${link.topic ? `/${link.topic}` : ''}`;
  const fullUrl = `https://${linkUrl}`;
  const shareText = `Check out this file collection: ${link.title}`;

  const socialShareLinks = [
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`,
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
        className='max-w-2xl bg-white border border-[var(--neutral-200)]'
        from='bottom'
        transition={{ type: 'spring', stiffness: 180, damping: 25 }}
      >
        <DialogHeader className='text-center'>
          <DialogTitle className='text-xl font-bold text-[var(--quaternary)]'>
            Share &quot;{link.title}&quot;
          </DialogTitle>
          <DialogDescription className='text-[var(--neutral-600)]'>
            Share this link with others to let them upload files
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 pt-4'>
          {/* URL Section */}
          <div className='space-y-3'>
            <label className='text-sm font-medium text-[var(--quaternary)]'>
              Link URL
            </label>
            <div className='flex items-center gap-2 p-3 bg-[var(--neutral-50)] border border-[var(--neutral-200)] rounded-lg'>
              <span className='flex-1 text-sm text-[var(--neutral-700)] break-all'>
                {fullUrl}
              </span>
              <CopyButton
                value={fullUrl}
                size='sm'
                showText
                variant='outline'
                className='flex-shrink-0'
              />
            </div>
          </div>

          {/* Link Type Info */}
          <div className='text-center p-3 bg-blue-50 border border-blue-200 rounded-lg'>
            <p className='text-sm text-blue-700'>
              <span className='font-medium'>Type:</span>{' '}
              {link.linkType === 'base'
                ? 'Personal Collection'
                : 'Topic Collection'}
              {link.topic && (
                <span className='block mt-1'>Topic: {link.topic}</span>
              )}
            </p>
          </div>

          {/* QR Code Section */}
          <div className='space-y-3'>
            <label className='text-sm font-medium text-[var(--quaternary)]'>
              QR Code
            </label>
            <div className='flex items-center justify-center p-6 bg-[var(--neutral-50)] border border-[var(--neutral-200)] rounded-lg'>
              <div className='text-center'>
                <QrCode className='w-16 h-16 text-[var(--neutral-400)] mx-auto mb-2' />
                <p className='text-sm text-[var(--neutral-500)]'>
                  QR code will be generated here
                </p>
              </div>
            </div>
          </div>

          {/* Social Share Section */}
          <div className='space-y-3'>
            <label className='text-sm font-medium text-[var(--quaternary)]'>
              Share on Social Media
            </label>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
              {socialShareLinks.map(social => {
                const IconComponent = social.icon;
                return (
                  <ActionButton
                    key={social.name}
                    variant='outline'
                    size='default'
                    motionType='subtle'
                    onClick={() => handleSocialShare(social.url)}
                    className={`flex flex-col items-center gap-2 p-4 h-auto ${social.bgColor}`}
                  >
                    <IconComponent className={`w-5 h-5 ${social.color}`} />
                    <span className='text-xs font-medium'>{social.name}</span>
                  </ActionButton>
                );
              })}
            </div>
          </div>

          {/* Email Section */}
          <div className='space-y-3'>
            <label className='text-sm font-medium text-[var(--quaternary)]'>
              Share via Email
            </label>
            <ActionButton
              variant='outline'
              size='default'
              motionType='subtle'
              onClick={() => {
                const mailtoUrl = `mailto:?subject=${encodeURIComponent(`File Collection: ${link.title}`)}&body=${encodeURIComponent(`${shareText}\n\n${fullUrl}`)}`;
                window.location.href = mailtoUrl;
              }}
              className='w-full flex items-center justify-center gap-2'
            >
              <Mail className='w-4 h-4' />
              Open Email Client
            </ActionButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
