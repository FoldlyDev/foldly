/**
 * CreateLinkForm Store - Form state management for create link modal
 * Following 2025 Zustand patterns with pure reducers and auto-generated actions
 * Enhanced with React Hook Form + Zod integration for dynamic save buttons
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useEffect } from 'react';
import { useZodForm } from '@/lib/hooks/use-zod-form';
import { createLinkFormSchema } from '../schemas';
import {
  createReducers,
  convertReducersToActions,
  type Reducer,
} from '../store/utils/convert-reducers-to-actions';
import type { LinkType } from '@/lib/supabase/types';
import type { HexColor } from '@/lib/supabase/types';

// =============================================================================
// FORM STATE TYPES
// =============================================================================

// Form step type
type CreateLinkStep = 'information' | 'branding' | 'success';

// Basic form data interface - will use database types for final submission
interface CreateLinkFormData {
  title: string;
  topic: string;
  description: string;
  instructions: string;
  requireEmail: boolean;
  requirePassword: boolean;
  password: string;
  isPublic: boolean;
  maxFiles: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  expiresAt: Date | null;
  brandingEnabled: boolean;
  brandColor: string;
  accentColor: string;
  logoUrl: string;
}

// Form state interface
interface CreateLinkFormState {
  formData: CreateLinkFormData;
  currentStep: CreateLinkStep;
  isValid: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
  isSubmitting: boolean;
}

// =============================================================================
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
  maxFileSize: 104857600, // 100MB in bytes
  allowedFileTypes: [],
  expiresAt: null,
  brandingEnabled: false,
  brandColor: '',
  accentColor: '',
  logoUrl: '',
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
  ) => {
    console.log('🏪 FORM STORE: updateMultipleFields called with:', updates);
    console.log(
      '🏪 FORM STORE: Current password in store:',
      state.formData.password ? '[PASSWORD SET]' : '[PASSWORD EMPTY]'
    );

    const newFormData = {
      ...state.formData,
      ...updates,
    };

    console.log(
      '🏪 FORM STORE: New password in store will be:',
      newFormData.password ? '[PASSWORD SET]' : '[PASSWORD EMPTY]'
    );

    return {
      ...state,
      formData: newFormData,
    };
  },

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
);

// =============================================================================
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
      // Base links: always valid (uses hardcoded "Personal Collection" name)
      if (state.linkType === 'base') {
        return true;
      }
      // Topic/custom links: only require topic field to be filled
      return (
        (state.linkType === 'custom' || state.linkType === 'generated') &&
        state.formData.topic.trim() !== ''
      );
    }
    if (state.currentStep === 'branding') {
      return true; // Branding is optional, always can proceed
    }
    return false;
  },

  canGoPrevious: (state: CreateLinkFormState) => {
    return (
      state.currentStep !== 'information' && state.currentStep !== 'success'
    );
  },

  isInformationStepValid: (state: CreateLinkFormState) => {
    // Base links: always valid
    if (state.linkType === 'base') {
      return true;
    }
    // Topic/custom links: require topic field only
    return (
      (state.linkType === 'custom' || state.linkType === 'generated') &&
      state.formData.topic.trim() !== ''
    );
  },
};

// =============================================================================
// REACT HOOK FORM INTEGRATION
// =============================================================================

/**
 * Enhanced Create Link Form Hook with React Hook Form + Zod + Zustand Integration
 * Following 2025 best practices from Brendonovich's ultimate form abstraction
 *
 * Features:
 * - Automatic dirty state tracking
 * - Dynamic button visibility and text
 * - Zustand state sync
 * - Type-safe form validation with Zod
 */

export interface UseCreateLinkFormEnhancedReturn {
  // Form control (React Hook Form)
  form: ReturnType<typeof useZodForm<typeof createLinkFormSchema>>;

  // Zustand store state
  currentStep: CreateLinkStep;
  linkType: LinkType;
  isSubmitting: boolean;

  // Dynamic dirty state tracking
  isDirty: boolean;
  hasUnsavedChanges: boolean;

  // Step navigation
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastStep: boolean;
  isFirstStep: boolean;

  // Actions
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: CreateLinkStep) => void;
  handleSubmit: () => Promise<void>;
  resetForm: () => void;

  // Dynamic button states
  shouldShowSaveButton: boolean;
  shouldShowSaveAndCloseButton: boolean;
  saveButtonText: string;
  cancelButtonText: string;
}

export const useCreateLinkFormEnhanced =
  (): UseCreateLinkFormEnhancedReturn => {
    // Zustand store state
    const currentStep = useCreateLinkFormStore(
      createLinkFormSelectors.currentStep
    );
    const linkType = useCreateLinkFormStore(createLinkFormSelectors.linkType);
    const isSubmitting = useCreateLinkFormStore(
      createLinkFormSelectors.isSubmitting
    );
    const formData = useCreateLinkFormStore(createLinkFormSelectors.formData);

    // Zustand actions
    const nextStepAction = useCreateLinkFormStore(state => state.nextStep);
    const previousStepAction = useCreateLinkFormStore(
      state => state.previousStep
    );
    const setCurrentStep = useCreateLinkFormStore(
      state => state.setCurrentStep
    );
    const updateMultipleFields = useCreateLinkFormStore(
      state => state.updateMultipleFields
    );
    const resetFormAction = useCreateLinkFormStore(state => state.resetForm);

    // React Hook Form integration
    const form = useZodForm({
      schema: createLinkFormSchema,
      defaultValues: formData,
      mode: 'onChange', // Validate on change for immediate feedback
    });

    const {
      formState: { isDirty },
      watch,
      reset,
    } = form;

    // Watch form values for Zustand sync
    const watchedValues = watch();

    // Sync form changes to Zustand store
    useEffect(() => {
      if (isDirty) {
        updateMultipleFields(watchedValues);
      }
    }, [watchedValues, isDirty, updateMultipleFields]);

    // Step management
    const steps: CreateLinkStep[] = ['information', 'branding', 'success'];
    const currentStepIndex = steps.indexOf(currentStep);
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;

    // Navigation conditions
    const canGoNext = currentStepIndex < steps.length - 1;
    const canGoPrevious = currentStepIndex > 0;

    // Dynamic button state logic
    const hasUnsavedChanges = isDirty;
    const shouldShowSaveButton = hasUnsavedChanges;
    const shouldShowSaveAndCloseButton = hasUnsavedChanges;

    // Dynamic button text based on state
    const saveButtonText = hasUnsavedChanges ? 'Save Changes' : 'Save';
    const cancelButtonText = hasUnsavedChanges ? 'Cancel' : 'Close';

    // Step navigation functions
    const nextStep = () => {
      if (canGoNext) {
        nextStepAction();
      }
    };

    const previousStep = () => {
      if (canGoPrevious) {
        previousStepAction();
      }
    };

    const goToStep = (step: CreateLinkStep) => {
      if (steps.includes(step)) {
        setCurrentStep(step);
      }
    };

    // Form submission
    const handleSubmit = async () => {
      const isValid = await form.trigger(); // Validate entire form

      if (!isValid) {
        console.warn('Form validation failed');
        return;
      }

      // Use form.handleSubmit to get validated data
      form.handleSubmit(async validatedData => {
        // Handle the actual submission logic here
        console.log('Form submitted with validated data:', validatedData);

        // You can add your submission logic here
        // For now, we'll just simulate it
        await new Promise(resolve => setTimeout(resolve, 1000));
      })();
    };

    // Reset form function
    const resetForm = () => {
      reset();
      resetFormAction();
    };

    return {
      // Form control
      form,

      // Zustand store state
      currentStep,
      linkType,
      isSubmitting,

      // Dirty state tracking
      isDirty,
      hasUnsavedChanges,

      // Step navigation
      canGoNext,
      canGoPrevious,
      isLastStep,
      isFirstStep,

      // Actions
      nextStep,
      previousStep,
      goToStep,
      handleSubmit,
      resetForm,

      // Dynamic button states
      shouldShowSaveButton,
      shouldShowSaveAndCloseButton,
      saveButtonText,
      cancelButtonText,
    };
  };
