'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle, ExternalLink, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/animate-ui/radix/dialog';
import { GradientButton } from '@/components/ui';
import {
  LinkInformationSection,
  type LinkInformationFormData,
} from '../sections/link-information-section';
import {
  LinkBrandingSection,
  type LinkBrandingFormData,
} from '../sections/link-branding-section';
import { useLinksListStore } from '../../hooks/use-links-composite';

// Use existing types from @/types
import type { CreateBaseLinkInput, LinkType, LinkData } from '../../types';
import type { ValidationError } from '@/components/ui/types';
import type { HexColor } from '@/types/ids';

type Step = 'information' | 'branding' | 'success';

interface LinkCreationModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly linkType: 'base' | 'topic';
}

interface FormErrors {
  readonly information?: Partial<
    Record<keyof LinkInformationFormData, ValidationError>
  >;
  readonly branding?: Partial<
    Record<keyof LinkBrandingFormData, ValidationError>
  >;
  readonly general?: ValidationError;
}

export function LinkCreationModal({
  isOpen,
  onClose,
  linkType,
}: LinkCreationModalProps) {
  const { user } = useUser();
  const { addLink, isLoading } = useLinksListStore();

  // Ref for the scrollable content area
  const contentRef = useRef<HTMLDivElement>(null);

  // Form state
  const [currentStep, setCurrentStep] = useState<Step>('information');
  const [informationData, setInformationData] =
    useState<LinkInformationFormData>({
      name: linkType === 'base' ? 'Personal Collection' : '',
      description: '',
      requireEmail: false,
      maxFiles: 25,
      isPublic: true,
      requirePassword: false,
      isActive: true,
    });
  const [brandingData, setBrandingData] = useState<LinkBrandingFormData>({
    brandingEnabled: false,
    brandColor: '#6c47ff' as HexColor,
    accentColor: '#4ade80' as HexColor,
    logoFile: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [createdLinkId, setCreatedLinkId] = useState<string | null>(null);

  // Get username from Clerk
  const username = user?.username || user?.firstName || 'user';

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('information');
      setInformationData({
        name: linkType === 'base' ? 'Personal Collection' : '',
        description: '',
        requireEmail: false,
        maxFiles: 25,
        isPublic: true,
        requirePassword: false,
        isActive: true,
      });
      setBrandingData({
        brandingEnabled: false,
        brandColor: '#6c47ff' as HexColor,
        accentColor: '#4ade80' as HexColor,
        logoFile: null,
      });
      setErrors({});
      setCreatedLinkId(null);
    }
  }, [isOpen]);

  // Validation function
  const validateInformationStep = (): boolean => {
    const newErrors: Partial<
      Record<keyof LinkInformationFormData, ValidationError>
    > = {};

    // Only validate name for topic links
    if (linkType === 'topic') {
      if (!informationData.name.trim()) {
        newErrors.name = 'Topic name is required' as ValidationError;
      } else if (informationData.name.length < 2) {
        newErrors.name =
          'Topic name must be at least 2 characters' as ValidationError;
      } else if (!/^[a-zA-Z0-9\s-_]+$/.test(informationData.name)) {
        newErrors.name =
          'Topic name can only contain letters, numbers, spaces, hyphens, and underscores' as ValidationError;
      }
    }

    // Validate description (optional but if provided, must be reasonable length)
    if (
      informationData.description &&
      informationData.description.length > 500
    ) {
      newErrors.description =
        'Description must be less than 500 characters' as ValidationError;
    }

    setErrors(prev => ({ ...prev, information: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateBrandingStep = (): boolean => {
    const newErrors: Partial<
      Record<keyof LinkBrandingFormData, ValidationError>
    > = {};

    // Only validate if branding is enabled
    if (brandingData.brandingEnabled) {
      // Validate colors are valid hex
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

      if (!hexColorRegex.test(brandingData.brandColor)) {
        newErrors.brandColor =
          'Please enter a valid hex color' as ValidationError;
      }

      if (!hexColorRegex.test(brandingData.accentColor)) {
        newErrors.accentColor =
          'Please enter a valid hex color' as ValidationError;
      }

      // Validate logo file if provided
      if (brandingData.logoFile) {
        const maxSize = 2 * 1024 * 1024; // 2MB
        const allowedTypes = [
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/svg+xml',
        ];

        if (brandingData.logoFile.size > maxSize) {
          newErrors.logoFile =
            'Logo file must be less than 2MB' as ValidationError;
        }

        if (!allowedTypes.includes(brandingData.logoFile.type)) {
          newErrors.logoFile =
            'Logo must be PNG, JPG, or SVG format' as ValidationError;
        }
      }
    }

    setErrors(prev => ({ ...prev, branding: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToBranding = () => {
    if (validateInformationStep()) {
      setCurrentStep('branding');
      // Reset scroll position
      if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBackToInformation = () => {
    setCurrentStep('information');
    // Reset scroll position
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCreateLink = async () => {
    if (!validateBrandingStep()) {
      return;
    }

    try {
      // Clear general error
      const { general, ...restErrors } = errors;
      setErrors(restErrors);

      // Convert logo file to URL if needed (simplified for now)
      let logoUrl: string | undefined;
      if (brandingData.brandingEnabled && brandingData.logoFile) {
        // In a real implementation, you'd upload the file and get a URL
        logoUrl = URL.createObjectURL(brandingData.logoFile);
      }

      // Prepare the link data using the correct interface
      const linkData: CreateBaseLinkInput = {
        username: username,
        title:
          linkType === 'base' ? 'Personal Collection' : informationData.name,
        ...(informationData.description && {
          description: informationData.description,
        }),
        requireEmail: informationData.requireEmail,
        requirePassword: informationData.requirePassword,
        ...(informationData.password && { password: informationData.password }),
        isPublic: informationData.isPublic,
        maxFiles: informationData.maxFiles,
        ...(informationData.expiresAt && {
          expiresAt: informationData.expiresAt,
        }),
        brandingEnabled: brandingData.brandingEnabled,
        ...(brandingData.brandingEnabled &&
          brandingData.brandColor && { brandColor: brandingData.brandColor }),
        ...(brandingData.brandingEnabled &&
          brandingData.accentColor && {
            accentColor: brandingData.accentColor,
          }),
        ...(brandingData.brandingEnabled && logoUrl && { logoUrl }),
      };

      // Create a LinkData object and add to store
      const newLink: LinkData = {
        id: `link_${Date.now()}`, // Mock ID generation
        name:
          linkType === 'base' ? 'Personal Collection' : informationData.name,
        title:
          linkType === 'base' ? 'Personal Collection' : informationData.name,
        slug: username,
        linkType: 'base', // Base links are always 'base' type
        isPublic: informationData.isPublic,
        status: 'active',
        url: `foldly.io/${username}`,
        uploads: 0,
        views: 0,
        lastActivity: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        ...(informationData.expiresAt && {
          expiresAt: informationData.expiresAt.toLocaleDateString(),
        }),
        requireEmail: informationData.requireEmail,
        allowedFileTypes: [],
        autoCreateFolders: true,
        settings: {
          allowMultiple: true,
          maxFileSize: `${informationData.maxFiles}MB`,
          ...(informationData.description && {
            customMessage: informationData.description,
          }),
        },
        ...(brandingData.brandingEnabled &&
          brandingData.brandColor && { brandColor: brandingData.brandColor }),
      };

      // Add to store
      addLink(newLink);
      setCreatedLinkId(newLink.id);
      setCurrentStep('success');
      toast.success(
        `${linkType === 'base' ? 'Base link' : 'Topic link'} created successfully!`
      );
    } catch (error) {
      console.error('Error creating link:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create link';
      setErrors(prev => ({
        ...prev,
        general: errorMessage as ValidationError,
      }));
      toast.error('Failed to create link. Please try again.');
    }
  };

  const handleCopyLink = () => {
    const linkUrl =
      linkType === 'base'
        ? `https://foldly.io/${username}`
        : `https://foldly.io/${username}/${informationData.name}`;

    navigator.clipboard.writeText(linkUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleClose = () => {
    setCurrentStep('information');
    setErrors({});
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'information':
        return (
          <LinkInformationSection
            linkType={linkType}
            username={username}
            formData={informationData}
            onDataChange={data =>
              setInformationData(prev => ({ ...prev, ...data }))
            }
            errors={errors.information || {}}
            isLoading={isLoading}
          />
        );

      case 'branding':
        return (
          <LinkBrandingSection
            linkType={linkType}
            username={username}
            linkName={
              linkType === 'base' ? 'Personal Collection' : informationData.name
            }
            description={informationData.description}
            formData={brandingData}
            onDataChange={data =>
              setBrandingData(prev => ({ ...prev, ...data }))
            }
            errors={errors.branding || {}}
            isLoading={isLoading}
          />
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center space-y-6'
          >
            <div className='space-y-3'>
              <div className='mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
                <CheckCircle className='w-8 h-8 text-green-600' />
              </div>
              <h2 className='text-xl font-semibold text-foreground'>
                {linkType === 'base' ? 'Base Link' : 'Topic Link'} Created!
              </h2>
              <p className='text-muted-foreground max-w-md mx-auto'>
                Your {linkType} link is now ready. Share it with others to start
                receiving files.
              </p>
            </div>

            <div className='space-y-3'>
              <div className='p-4 bg-muted/30 rounded-lg border'>
                <p className='text-sm text-muted-foreground mb-2'>
                  Your new link:
                </p>
                <div className='font-mono text-sm text-primary break-all'>
                  {linkType === 'base'
                    ? `foldly.io/${username}`
                    : `foldly.io/${username}/${informationData.name}`}
                </div>
              </div>

              <div className='flex flex-col sm:flex-row gap-3'>
                <button
                  onClick={handleCopyLink}
                  className='flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer'
                >
                  <Copy className='w-4 h-4' />
                  Copy Link
                </button>
                <button
                  onClick={() =>
                    window.open(
                      linkType === 'base'
                        ? `https://foldly.io/${username}`
                        : `https://foldly.io/${username}/${informationData.name}`,
                      '_blank'
                    )
                  }
                  className='flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors cursor-pointer'
                >
                  <ExternalLink className='w-4 h-4' />
                  Open Link
                </button>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'information':
        return `Create ${linkType === 'base' ? 'Base' : 'Topic'} Link`;
      case 'branding':
        return 'Customize Branding';
      case 'success':
        return 'Link Created';
      default:
        return '';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'information':
        return linkType === 'base'
          ? 'Set up your personal file collection link'
          : 'Configure your topic-specific collection';
      case 'branding':
        return 'Customize the appearance of your collection page';
      case 'success':
        return 'Your link is ready to use';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className='w-[95vw] max-w-2xl h-[85vh] max-h-[800px] p-0 gap-0 overflow-hidden flex flex-col'
        from='top'
      >
        {/* Header */}
        <DialogHeader className='px-6 pt-6 pb-4 shrink-0 border-b'>
          <DialogTitle className='text-xl font-semibold'>
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground'>
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        {currentStep !== 'success' && (
          <div className='flex items-center justify-center py-4 shrink-0'>
            <div className='flex items-center space-x-4'>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors ${
                  currentStep === 'information'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background text-muted-foreground'
                }`}
              >
                1
              </div>
              <div
                className={`h-1 w-12 rounded transition-colors ${
                  currentStep === 'branding' ? 'bg-primary' : 'bg-muted'
                }`}
              />
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors ${
                  currentStep === 'branding'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-background text-muted-foreground'
                }`}
              >
                2
              </div>
            </div>
          </div>
        )}

        {/* Main content area - scrollable */}
        <div className='flex-1 overflow-y-auto px-6 py-4' ref={contentRef}>
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Error display */}
        {errors.general && (
          <div className='mx-6 mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm shrink-0'>
            {errors.general}
          </div>
        )}

        {/* Footer with navigation buttons */}
        {currentStep !== 'success' && (
          <div className='flex flex-col-reverse sm:flex-row justify-between items-center gap-3 p-6 pt-4 border-t shrink-0'>
            {/* Back button */}
            {currentStep === 'branding' && (
              <button
                onClick={handleBackToInformation}
                disabled={isLoading}
                className='inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
              >
                <ArrowLeft className='w-4 h-4' />
                Back to Information
              </button>
            )}

            {/* Action button */}
            <div className='flex gap-3'>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className='px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
              >
                Cancel
              </button>

              {currentStep === 'information' ? (
                <GradientButton
                  onClick={handleContinueToBranding}
                  disabled={isLoading}
                  className='px-6 py-2 cursor-pointer'
                >
                  Continue to Branding
                </GradientButton>
              ) : (
                <GradientButton
                  onClick={handleCreateLink}
                  disabled={isLoading}
                  className='px-6 py-2 cursor-pointer'
                >
                  {isLoading
                    ? 'Creating...'
                    : `Create ${linkType === 'base' ? 'Base' : 'Topic'} Link`}
                </GradientButton>
              )}
            </div>
          </div>
        )}

        {/* Success footer */}
        {currentStep === 'success' && (
          <div className='flex justify-center p-6 pt-4 border-t shrink-0'>
            <GradientButton
              onClick={handleClose}
              className='px-6 py-2 cursor-pointer'
            >
              Done
            </GradientButton>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
