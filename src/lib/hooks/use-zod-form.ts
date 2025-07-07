/**
 * Custom React Hook Form + Zod Integration
 * Following 2025 best practices from https://www.brendonovich.dev/blog/the-ultimate-form-abstraction
 * Provides type-safe forms with automatic validation
 */

import { useForm } from 'react-hook-form';
import type { UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

interface UseZodFormProps<Z extends z.ZodType<any, any, any>>
  extends Exclude<UseFormProps<z.infer<Z>>, 'resolver'> {
  schema: Z;
}

/**
 * Enhanced useForm hook with automatic Zod validation
 * Provides complete type safety from schema to form data
 *
 * @param schema - Zod schema for validation
 * @param formProps - Additional useForm props
 * @returns React Hook Form instance with Zod resolver
 */
export const useZodForm = <Z extends z.ZodType<any, any, any>>({
  schema,
  ...formProps
}: UseZodFormProps<Z>) =>
  useForm({
    ...formProps,
    resolver: zodResolver(schema),
  });

/**
 * Type helper to extract form data type from Zod schema
 */
export type FormData<Z extends z.ZodType<any, any, any>> = z.infer<Z>;
