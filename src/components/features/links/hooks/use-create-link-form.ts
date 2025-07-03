/**
 * CreateLinkForm Store - Form state management for create link modal
 * Following 2025 Zustand patterns with pure reducers and auto-generated actions
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  createReducers,
  convertReducersToActions,
  type Reducer,
} from '../store/utils/convert-reducers-to-actions';
import type { LinkType } from '../types';
import type { HexColor } from '@/types/ids';

// =============================================================================
// FORM STATE TYPES
// =============================================================================

export type CreateLinkStep = 'information' | 'branding' | 'success';

export interface CreateLinkFormData {
  // Basic information
  title: string;
  topic: string;
  description: string;
  instructions: string;

  // Security settings
  requireEmail: boolean;
  requirePassword: boolean;
  password: string;
  isPublic: boolean;

  // Upload settings
  maxFiles: number;
  maxFileSize: number; // in MB
  allowedFileTypes: string[];
  expiresAt: string; // ISO date string
  autoCreateFolders: boolean;
  allowFolderCreation: boolean;

  // Branding
  brandingEnabled: boolean;
  brandColor: HexColor | '';
  accentColor: HexColor | '';
  logoUrl: string;
  customCss: string;
  welcomeMessage: string;
}

interface CreateLinkFormState {
  // Form data
  linkType: LinkType;
  formData: CreateLinkFormData;

  // UI state
  currentStep: CreateLinkStep;
  isValid: boolean;
  isSubmitting: boolean;

  // Success state
  createdLinkId: string | null;
  generatedUrl: string | null;

  // Error handling
  fieldErrors: Partial<Record<keyof CreateLinkFormData, string>>;
  generalError: string | null;
} // =============================================================================
// INITIAL STATE
// =============================================================================

const initialFormData: CreateLinkFormData = {
  title: '',
  topic: '',
  description: '',
  instructions: '',
  requireEmail: false,
  requirePassword: false,
  password: '',
  isPublic: true,
  maxFiles: 100,
  maxFileSize: 100, // 100MB default
  allowedFileTypes: [],
  expiresAt: '',
  autoCreateFolders: false,
  allowFolderCreation: true,
  brandingEnabled: false,
  brandColor: '',
  accentColor: '',
  logoUrl: '',
  customCss: '',
  welcomeMessage: '',
};

const initialState: CreateLinkFormState = {
  linkType: 'base',
  formData: initialFormData,
  currentStep: 'information',
  isValid: false,
  isSubmitting: false,
  createdLinkId: null,
  generatedUrl: null,
  fieldErrors: {},
  generalError: null,
};

// =============================================================================
// PURE REDUCERS
// =============================================================================

const formReducers = createReducers<
  CreateLinkFormState,
  {
    initializeForm: Reducer<CreateLinkFormState, [LinkType]>;
    resetForm: Reducer<CreateLinkFormState, []>;
    setCurrentStep: Reducer<CreateLinkFormState, [CreateLinkStep]>;
    nextStep: Reducer<CreateLinkFormState, []>;
    previousStep: Reducer<CreateLinkFormState, []>;
    updateFormField: Reducer<
      CreateLinkFormState,
      [keyof CreateLinkFormData, any]
    >;
    updateMultipleFields: Reducer<
      CreateLinkFormState,
      [Partial<CreateLinkFormData>]
    >;
    setFieldError: Reducer<
      CreateLinkFormState,
      [keyof CreateLinkFormData, string | undefined]
    >;
    clearFieldErrors: Reducer<CreateLinkFormState, []>;
    setGeneralError: Reducer<CreateLinkFormState, [string | null]>;
    setSubmitting: Reducer<CreateLinkFormState, [boolean]>;
    setSuccess: Reducer<CreateLinkFormState, [string, string]>;
  }
>({
  initializeForm: (state: CreateLinkFormState, linkType: LinkType) => ({
    ...state,
    linkType,
    formData: { ...initialFormData },
    currentStep: 'information',
    isValid: false,
    fieldErrors: {},
    generalError: null,
  }),

  resetForm: (): CreateLinkFormState => initialState,

  setCurrentStep: (state: CreateLinkFormState, step: CreateLinkStep) => ({
    ...state,
    currentStep: step,
  }),

  nextStep: (state: CreateLinkFormState) => {
    const stepOrder: CreateLinkStep[] = ['information', 'branding', 'success'];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    const nextIndex = Math.min(currentIndex + 1, stepOrder.length - 1);
    const nextStep = stepOrder[nextIndex];
    return {
      ...state,
      currentStep: nextStep || state.currentStep,
    };
  },

  previousStep: (state: CreateLinkFormState) => {
    const stepOrder: CreateLinkStep[] = ['information', 'branding', 'success'];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    const previousIndex = Math.max(currentIndex - 1, 0);
    const previousStep = stepOrder[previousIndex];
    return {
      ...state,
      currentStep: previousStep || state.currentStep,
    };
  },

  updateFormField: (
    state: CreateLinkFormState,
    field: keyof CreateLinkFormData,
    value: any
  ) => ({
    ...state,
    formData: {
      ...state.formData,
      [field]: value,
    },
  }),

  updateMultipleFields: (
    state: CreateLinkFormState,
    updates: Partial<CreateLinkFormData>
  ) => ({
    ...state,
    formData: {
      ...state.formData,
      ...updates,
    },
  }),

  setFieldError: (
    state: CreateLinkFormState,
    field: keyof CreateLinkFormData,
    error: string | undefined
  ) => ({
    ...state,
    fieldErrors: error
      ? { ...state.fieldErrors, [field]: error }
      : { ...state.fieldErrors, [field]: undefined },
  }),

  clearFieldErrors: (state: CreateLinkFormState) => ({
    ...state,
    fieldErrors: {},
    generalError: null,
  }),

  setGeneralError: (state: CreateLinkFormState, error: string | null) => ({
    ...state,
    generalError: error,
  }),

  setSubmitting: (state: CreateLinkFormState, isSubmitting: boolean) => ({
    ...state,
    isSubmitting,
  }),

  setSuccess: (state: CreateLinkFormState, linkId: string, url: string) => ({
    ...state,
    currentStep: 'success' as const,
    isSubmitting: false,
    createdLinkId: linkId,
    generatedUrl: url,
    generalError: null,
  }),
});

// =============================================================================
// STORE CREATION
// =============================================================================

type CreateLinkFormActions = {
  [K in keyof typeof formReducers]: (typeof formReducers)[K] extends (
    state: any,
    ...args: infer Args
  ) => any
    ? (...args: Args) => void
    : never;
};

export const useCreateLinkFormStore = create<
  CreateLinkFormState & CreateLinkFormActions
>()(
  devtools(
    set => ({
      ...initialState,
      ...convertReducersToActions(set as any, formReducers),
    }),
    { name: 'CreateLinkFormStore' }
  )
); // =============================================================================
// SELECTORS
// =============================================================================

export const createLinkFormSelectors = {
  currentStep: (state: CreateLinkFormState) => state.currentStep,
  formData: (state: CreateLinkFormState) => state.formData,
  isValid: (state: CreateLinkFormState) => state.isValid,
  isSubmitting: (state: CreateLinkFormState) => state.isSubmitting,
  fieldErrors: (state: CreateLinkFormState) => state.fieldErrors,
  generalError: (state: CreateLinkFormState) => state.generalError,
  createdLinkId: (state: CreateLinkFormState) => state.createdLinkId,
  generatedUrl: (state: CreateLinkFormState) => state.generatedUrl,
  linkType: (state: CreateLinkFormState) => state.linkType,

  // Computed selectors
  canGoNext: (state: CreateLinkFormState) => {
    if (state.currentStep === 'information') {
      return state.linkType === 'base'
        ? true // Base links only need basic validation
        : state.formData.title.trim() !== '' &&
            state.formData.topic.trim() !== '';
    }
    if (state.currentStep === 'branding') {
      return true; // Branding is optional
    }
    return false;
  },

  canGoPrevious: (state: CreateLinkFormState) => {
    return (
      state.currentStep !== 'information' && state.currentStep !== 'success'
    );
  },

  isInformationStepValid: (state: CreateLinkFormState) => {
    return (
      state.linkType === 'base' ||
      (state.formData.title.trim() !== '' && state.formData.topic.trim() !== '')
    );
  },
};
