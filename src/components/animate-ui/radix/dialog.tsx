'use client';

import * as React from 'react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { X } from '@/components/animate-ui/icons/x';
import {
  AnimatePresence,
  motion,
  type HTMLMotionProps,
  type Transition,
} from 'motion/react';

import { cn } from '@/lib/utils/utils';
import { useIsMobile } from '@/lib/hooks/use-mobile';

type DialogContextType = {
  isOpen: boolean;
};

const DialogContext = React.createContext<DialogContextType | undefined>(
  undefined
);

const useDialog = (): DialogContextType => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a Dialog');
  }
  return context;
};

type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>;

function Dialog({ children, ...props }: DialogProps) {
  const [isOpen, setIsOpen] = React.useState(
    props?.open ?? props?.defaultOpen ?? false
  );

  React.useEffect(() => {
    if (props?.open !== undefined) setIsOpen(props.open);
  }, [props?.open]);

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open);
      props.onOpenChange?.(open);
    },
    [props]
  );

  return (
    <DialogContext.Provider value={{ isOpen }}>
      <DialogPrimitive.Root
        data-slot='dialog'
        {...props}
        onOpenChange={handleOpenChange}
      >
        {children}
      </DialogPrimitive.Root>
    </DialogContext.Provider>
  );
}

type DialogTriggerProps = React.ComponentProps<typeof DialogPrimitive.Trigger>;

function DialogTrigger(props: DialogTriggerProps) {
  return <DialogPrimitive.Trigger data-slot='dialog-trigger' {...props} />;
}

type DialogPortalProps = React.ComponentProps<typeof DialogPrimitive.Portal>;

function DialogPortal(props: DialogPortalProps) {
  return <DialogPrimitive.Portal data-slot='dialog-portal' {...props} />;
}

type DialogCloseProps = React.ComponentProps<typeof DialogPrimitive.Close>;

function DialogClose(props: DialogCloseProps) {
  return <DialogPrimitive.Close data-slot='dialog-close' {...props} />;
}

type DialogOverlayProps = React.ComponentProps<typeof DialogPrimitive.Overlay>;

function DialogOverlay({ className, ...props }: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      data-slot='dialog-overlay'
      className={cn(
        'fixed inset-0 z-50 modal-backdrop data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  );
}

type FlipDirection = 'top' | 'bottom' | 'left' | 'right';

type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content> &
  HTMLMotionProps<'div'> & {
    from?: FlipDirection;
    transition?: Transition;
  };

function DialogContent({
  className,
  children,
  from = 'top',
  transition = { type: 'spring', stiffness: 150, damping: 25 },
  ...props
}: DialogContentProps) {
  const { isOpen } = useDialog();
  const isMobile = useIsMobile();

  const initialRotation =
    from === 'top' || from === 'left' ? '20deg' : '-20deg';
  const isVertical = from === 'top' || from === 'bottom';
  const rotateAxis = isVertical ? 'rotateX' : 'rotateY';

  // Use simple animations on mobile to prevent blur
  const mobileAnimations = {
    initial: { 
      opacity: 0, 
      scale: 0.95,
      y: 20 
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: 20 
    }
  };

  const desktopAnimations = {
    initial: {
      opacity: 0,
      filter: 'blur(4px)',
      transform: `perspective(500px) ${rotateAxis}(${initialRotation}) scale(0.8)`,
    },
    animate: {
      opacity: 1,
      filter: 'blur(0px)',
      transform: `perspective(500px) ${rotateAxis}(0deg) scale(1)`,
    },
    exit: {
      opacity: 0,
      filter: 'blur(4px)',
      transform: `perspective(500px) ${rotateAxis}(${initialRotation}) scale(0.8)`,
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <DialogPortal forceMount data-slot='dialog-portal'>
          <DialogOverlay asChild forceMount>
            <motion.div
              key='dialog-overlay'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            />
          </DialogOverlay>
          <DialogPrimitive.Content asChild forceMount {...props}>
            <motion.div
              key='dialog-content'
              data-slot='dialog-content'
              initial={isMobile ? mobileAnimations.initial : desktopAnimations.initial}
              animate={isMobile ? mobileAnimations.animate : desktopAnimations.animate}
              exit={isMobile ? mobileAnimations.exit : desktopAnimations.exit}
              transition={transition}
              className={cn(
                'fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 modal-container modal-float rounded-2xl p-0 overflow-hidden',
                isMobile && 'transform-gpu will-change-auto',
                className
              )}
              {...props}
            >
              {children}
              <DialogPrimitive.Close className='absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 opacity-70 transition-all duration-200 hover:opacity-100 hover:scale-110 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none cursor-pointer icon-hover'>
                <X size={16} className="text-gray-600 hover:text-gray-800" />
                <span className='sr-only'>Close</span>
              </DialogPrimitive.Close>
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPortal>
      )}
    </AnimatePresence>
  );
}

type DialogHeaderProps = React.ComponentProps<'div'>;

function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return (
    <div
      data-slot='dialog-header'
      className={cn(
        'flex flex-col space-y-1.5 text-center sm:text-left',
        className
      )}
      {...props}
    />
  );
}

type DialogFooterProps = React.ComponentProps<'div'>;

function DialogFooter({ className, ...props }: DialogFooterProps) {
  return (
    <div
      data-slot='dialog-footer'
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end gap-2',
        className
      )}
      {...props}
    />
  );
}

type DialogTitleProps = React.ComponentProps<typeof DialogPrimitive.Title>;

function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot='dialog-title'
      className={cn(
        'text-lg font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  );
}

type DialogDescriptionProps = React.ComponentProps<
  typeof DialogPrimitive.Description
>;

function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot='dialog-description'
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  useDialog,
  type DialogContextType,
  type DialogProps,
  type DialogTriggerProps,
  type DialogPortalProps,
  type DialogCloseProps,
  type DialogOverlayProps,
  type DialogContentProps,
  type DialogHeaderProps,
  type DialogFooterProps,
  type DialogTitleProps,
  type DialogDescriptionProps,
};
