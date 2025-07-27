/**
 * Simplified CreateLinkForm Hook - Temporary implementation during refactoring
 * Provides basic interface without complex reducer patterns
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useEffect } from 'react';
import type { LinkType } from '@/lib/database/types';
import { DEFAULT_FILE_SIZES, DEFAULT_FILE_TYPES } from '../lib/constants';

// Simplified form state types
export type CreateLinkStep = 'information' | 'branding' | 'success';

export interface CreateLinkFormData {
  linkType: LinkType;
  slug: string;
  title: string;
  topic: string;
  description: string;
  isPublic: boolean;
  isActive: boolean;
  requireEmail: boolean;
  requirePassword: boolean;
  password: string;
  expiresAt?: Date;
  maxFiles: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  brandEnabled: boolean;
  brandColor: string;
  logoUrl?: string;
  logoFile?: File | null;
}

interface CreateLinkFormState {
  // Form state
  currentStep: CreateLinkStep;
  linkType: LinkType;
  formData: CreateLinkFormData;
  generatedUrl: string;
  isSubmitting: boolean;
  generalError: string | null;

  // Actions
  initializeForm: (linkType: LinkType) => void;
  resetForm: () => void;
  setCurrentStep: (step: CreateLinkStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateFormField: (field: keyof CreateLinkFormData, value: any) => void;
  setGeneratedUrl: (url: string) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
}

const initialFormData: CreateLinkFormData = {
  linkType: 'base',
  slug: '',
  title: '',
  topic: '',
  description: '',
  isPublic: true,
  isActive: true,
  requireEmail: false,
  requirePassword: false,
  password: '',
  maxFiles: 100, // Updated from 10 to match defaults.ts
  maxFileSize: parseInt(DEFAULT_FILE_SIZES), // 10MB from constants
  allowedFileTypes: DEFAULT_FILE_TYPES === '*' ? [] : [DEFAULT_FILE_TYPES],
  brandEnabled: false,
  brandColor: '#6c47ff',
  logoUrl: '',
  logoFile: null,
};

const initialState = {
  currentStep: 'information' as CreateLinkStep,
  linkType: 'base' as LinkType,
  formData: initialFormData,
  generatedUrl: '',
  isSubmitting: false,
  generalError: null,
};

export const useCreateLinkFormStore = create<CreateLinkFormState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      initializeForm: (linkType: LinkType) => {
        const formData = { ...initialFormData, linkType };

        // Auto-populate title based on link type
        if (linkType === 'base') {
          formData.title = 'Base link'; // Default title for base links
        }

        set({
          linkType,
          currentStep: 'information',
          formData,
          generatedUrl: '',
          isSubmitting: false,
          generalError: null,
        });
      },

      resetForm: () => {
        set(initialState);
      },

      setCurrentStep: (step: CreateLinkStep) => {
        set({ currentStep: step });
      },

      nextStep: () => {
        const { currentStep } = get();
        const steps: CreateLinkStep[] = ['information', 'branding', 'success'];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex < steps.length - 1) {
          const nextStep = steps[currentIndex + 1];
          if (nextStep) {
            set({ currentStep: nextStep });
          }
        }
      },

      previousStep: () => {
        const { currentStep } = get();
        const steps: CreateLinkStep[] = ['information', 'branding', 'success'];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex > 0) {
          const prevStep = steps[currentIndex - 1];
          if (prevStep) {
            set({ currentStep: prevStep });
          }
        }
      },

      updateFormField: (field: keyof CreateLinkFormData, value: any) => {
        set(state => ({
          formData: { ...state.formData, [field]: value },
        }));
      },

      setGeneratedUrl: (url: string) => {
        set({ generatedUrl: url });
      },

      setSubmitting: (submitting: boolean) => {
        set({ isSubmitting: submitting });
      },

      setError: (error: string | null) => {
        set({ generalError: error });
      },
    }),
    { name: 'create-link-form' }
  )
);

// Selectors for easier access
export const createLinkFormSelectors = {
  currentStep: (state: CreateLinkFormState) => state.currentStep,
  linkType: (state: CreateLinkFormState) => state.linkType,
  formData: (state: CreateLinkFormState) => state.formData,
  generatedUrl: (state: CreateLinkFormState) => state.generatedUrl,
  isSubmitting: (state: CreateLinkFormState) => state.isSubmitting,
  generalError: (state: CreateLinkFormState) => state.generalError,

  // Computed selectors
  canProceed: (state: CreateLinkFormState) => {
    if (state.currentStep === 'information') {
      // For base links, just need a title (which is auto-generated)
      if (state.linkType === 'base') {
        return state.formData.title.length > 0;
      }
      // For topic/custom links, need either title or topic name
      return state.formData.title.length > 0 || state.formData.topic.length > 0;
    }
    return true;
  },

  isLastStep: (state: CreateLinkFormState) => {
    return state.currentStep === 'success';
  },
};
