'use client';

import { Calendar, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { Calendar as CalendarComponent } from '@/components/ui/shadcn/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/shadcn/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/utils';

interface LinkExpirationDateProps {
  formData: {
    expiresAt?: Date | null;
  };
  onDataChange: (data: any) => void;
  errors?: {
    expiresAt?: string;
  } | undefined;
  isLoading?: boolean;
}

export function LinkExpirationDate({
  formData,
  onDataChange,
  errors,
  isLoading = false,
}: LinkExpirationDateProps) {
  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium text-foreground flex items-center gap-2'>
        <Calendar className='h-4 w-4 text-amber-600' />
        Expiry Date (Optional)
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            disabled={isLoading}
            className={cn(
              'w-full justify-start text-left font-normal',
              !formData.expiresAt && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className='w-4 h-4 mr-2' />
            {formData.expiresAt ? (
              format(formData.expiresAt, 'MMM d, yyyy')
            ) : (
              <span>Pick expiry date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0'>
          <CalendarComponent
            mode='single'
            selected={formData.expiresAt || undefined}
            onSelect={date => {
              if (date) {
                onDataChange({ expiresAt: date });
              } else {
                const { expiresAt: _, ...rest } = formData;
                onDataChange(rest);
              }
            }}
            disabled={date => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return date < today;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {errors?.expiresAt && (
        <p className='text-sm text-destructive'>{errors.expiresAt}</p>
      )}
      <p className='text-xs text-muted-foreground'>
        Link will stop accepting uploads after this date
      </p>
    </div>
  );
}