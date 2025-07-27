import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GradientButton } from '@/components/ui/core/gradient-button';

describe('GradientButton Component', () => {
  // Normal behavior tests
  describe('Normal Behavior', () => {
    it('renders with default props', () => {
      render(<GradientButton>Click me</GradientButton>);
      const button = screen.getByRole('button', { name: /click me/i });

      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
      expect(button).not.toBeDisabled();
    });

    it('renders primary variant by default', () => {
      render(<GradientButton>Primary Button</GradientButton>);
      const button = screen.getByRole('button', { name: /primary button/i });

      expect(button).toHaveClass('bg-gradient-to-br');
      expect(button).toHaveClass('from-[var(--primary)]');
      expect(button).toHaveClass('text-[var(--quaternary)]');
    });

    it('renders secondary variant correctly', () => {
      render(
        <GradientButton variant='secondary'>Secondary Button</GradientButton>
      );
      const button = screen.getByRole('button', { name: /secondary button/i });

      expect(button).toHaveClass('from-[var(--secondary)]');
      expect(button).toHaveClass('text-[var(--quaternary)]');
    });

    it('renders tertiary variant correctly', () => {
      render(
        <GradientButton variant='tertiary'>Tertiary Button</GradientButton>
      );
      const button = screen.getByRole('button', { name: /tertiary button/i });

      expect(button).toHaveClass('from-[var(--tertiary)]');
      expect(button).toHaveClass('text-[var(--primary-subtle)]');
    });

    it('renders all sizes correctly', () => {
      const { rerender } = render(
        <GradientButton size='sm'>Small</GradientButton>
      );
      let button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm');

      rerender(<GradientButton size='md'>Medium</GradientButton>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-base');

      rerender(<GradientButton size='lg'>Large</GradientButton>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('px-8', 'py-4', 'text-lg');
    });

    it('applies custom className correctly', () => {
      render(<GradientButton className='custom-class'>Button</GradientButton>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('bg-gradient-to-br'); // Still has base classes
    });

    it('handles click events', () => {
      const handleClick = vi.fn();
      render(<GradientButton onClick={handleClick}>Clickable</GradientButton>);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // Edge case tests
  describe('Edge Cases', () => {
    it('handles disabled state correctly', () => {
      render(<GradientButton disabled>Disabled Button</GradientButton>);
      const button = screen.getByRole('button');

      expect(button).toBeDisabled();
      expect(button).toHaveClass(
        'disabled:opacity-50',
        'disabled:cursor-not-allowed'
      );
    });

    it('handles empty children gracefully', () => {
      render(<GradientButton>{''}</GradientButton>);
      const button = screen.getByRole('button');

      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe('');
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      render(<GradientButton ref={ref}>Button with ref</GradientButton>);

      expect(ref).toHaveBeenCalled();
    });

    it('applies hover and focus states', () => {
      render(<GradientButton>Hover me</GradientButton>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('hover:scale-[1.02]');
      expect(button).toHaveClass('focus-visible:ring-4');
      expect(button).toHaveClass('active:scale-[0.98]');
    });

    it('includes shimmer effect classes', () => {
      render(<GradientButton>Shimmer Button</GradientButton>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('before:absolute');
      expect(button).toHaveClass('before:bg-gradient-to-r');
      expect(button).toHaveClass('hover:before:opacity-100');
    });
  });

  // Failure case tests
  describe('Failure Cases', () => {
    it('prevents click when disabled', () => {
      const handleClick = vi.fn();
      render(
        <GradientButton disabled onClick={handleClick}>
          Disabled
        </GradientButton>
      );
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles undefined props gracefully', () => {
      // Testing that component works with undefined props
      const props = { variant: undefined, size: undefined };
      render(<GradientButton {...props}>Fallback Button</GradientButton>);
      const button = screen.getByRole('button');

      // Should fallback to primary variant and medium size
      expect(button).toHaveClass('from-[var(--primary)]');
      expect(button).toHaveClass('px-6', 'py-3', 'text-base');
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('has proper button role', () => {
      render(<GradientButton>Accessible Button</GradientButton>);
      const button = screen.getByRole('button');

      expect(button).toBeInTheDocument();
    });

    it('supports custom type attribute', () => {
      render(<GradientButton type='submit'>Submit Button</GradientButton>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('type', 'submit');
    });

    it('has focus-visible styles for keyboard navigation', () => {
      render(<GradientButton>Focus me</GradientButton>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('focus-visible:ring-4');
      expect(button).toHaveClass('focus-visible:ring-offset-2');
    });

    it('maintains text contrast with different variants', () => {
      // Test primary variant
      const { rerender } = render(
        <GradientButton variant='primary'>Primary</GradientButton>
      );
      let button = screen.getByRole('button');
      expect(button).toHaveClass('text-[var(--quaternary)]');

      // Test secondary variant
      rerender(<GradientButton variant='secondary'>Secondary</GradientButton>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('text-[var(--quaternary)]');

      // Test tertiary variant (should have light text)
      rerender(<GradientButton variant='tertiary'>Tertiary</GradientButton>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('text-[var(--primary-subtle)]');
    });
  });
});
