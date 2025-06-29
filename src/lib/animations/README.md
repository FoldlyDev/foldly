# Animation Library

A comprehensive collection of reusable Framer Motion animations using the latest Motion for React API.

## Installation & Setup

The animations are already configured to work with your project. You can use them in two ways:

### Method 1: Direct Usage (Client Components Only)

```tsx
import {
  fadeInWithBounce,
  slideInFromLeft,
  staggerContainer,
} from '@/lib/animations';
import { motion, AnimatePresence } from 'framer-motion';
```

### Method 2: Server Component Compatible (Recommended)

For use in Server Components, use our pre-built client component wrappers:

```tsx
import {
  AnimatedContainer,
  StaggerItem,
  AnimatePresenceWrapper,
} from '@/components/ui';

// Usage in Server Components:
<AnimatedContainer animationType='fadeInBounce'>
  <p>Content here</p>
</AnimatedContainer>;
```

## Animation Categories

### 🌊 Fade Animations

- `fadeIn` - Simple, gentle fade in/out
- `fadeInWithBounce` - Fade in with gentle spring scale animation
- `fadeOut` - Clean fade out

### 🏃 Slide Animations

- `slideInFromLeft` - Slide in from the left with spring physics
- `slideInFromRight` - Slide in from the right with spring physics
- `slideInFromTop` - Slide in from above with spring physics
- `slideInFromBottom` - Slide in from below with spring physics

### 📏 Scale Animations

- `scaleIn` - Scale up from 0.8 to 1.0 with spring
- `scaleInGentle` - Subtle scale from 0.95 to 1.0

### ✨ Special Animations

- `floatIn` - Gentle float up with scale animation
- `gentleBounce` - Soft bounce with scale and vertical movement
- `rippleIn` - Scale with slight rotation for dynamic feel

### 🎭 Hover Animations

- `gentleHover` - Subtle scale on hover (1.02x)
- `liftHover` - Lift effect with shadow animation

### 📱 Modal Animations

- `modalBackdrop` - Smooth backdrop fade
- `modalContent` - Modal content with scale and slide

### 🔄 Stagger Animations

- `staggerContainer` - Container for staggered children
- `staggerItem` - Individual items in stagger sequence

## Usage Examples

### Server Component Usage (Recommended)

```tsx
// In Server Components - use our client component wrappers
<AnimatedContainer animationType="fadeInBounce" className="my-container">
  Content here
</AnimatedContainer>

<AnimatedContainer animationType="stagger">
  <StaggerItem>Item 1</StaggerItem>
  <StaggerItem>Item 2</StaggerItem>
  <StaggerItem>Item 3</StaggerItem>
</AnimatedContainer>

<AnimatePresenceWrapper mode="wait">
  {showContent && (
    <AnimatedContainer animationType="slideUp" key="content">
      Dynamic content
    </AnimatedContainer>
  )}
</AnimatePresenceWrapper>
```

### Basic Animation (Client Components)

```tsx
<motion.div
  variants={fadeInWithBounce}
  initial='initial'
  animate='animate'
  exit='exit'
>
  Content here
</motion.div>
```

### Stagger Animation

```tsx
<motion.div variants={staggerContainer} initial='initial' animate='animate'>
  <motion.div variants={staggerItem}>Item 1</motion.div>
  <motion.div variants={staggerItem}>Item 2</motion.div>
  <motion.div variants={staggerItem}>Item 3</motion.div>
</motion.div>
```

### With AnimatePresence

```tsx
<AnimatePresence mode='wait'>
  {showContent && (
    <motion.div
      key='content'
      variants={slideInFromLeft}
      initial='initial'
      animate='animate'
      exit='exit'
    >
      Dynamic content
    </motion.div>
  )}
</AnimatePresence>
```

### Hover Animation

```tsx
<motion.button variants={gentleHover} initial='initial' whileHover='hover'>
  Hover me
</motion.button>
```

## Utility Functions

### createStagger(staggerDelay, delayChildren)

Create custom stagger timings:

```tsx
const customStagger = createStagger(0.2, 0.5);
```

### createFade(duration, easing)

Create custom fade with specific timing:

```tsx
const slowFade = createFade(1.2, 'easeInOut');
```

### createSlide(direction, distance, duration)

Create custom slide animations:

```tsx
const customSlide = createSlide('left', 100, 0.8);
```

## Transition Presets

Use pre-configured transitions for consistency:

- `gentleSpring` - Soft, natural spring
- `quickSpring` - Fast, responsive spring
- `slowSpring` - Deliberate, slow spring
- `easeInOut` - Smooth ease curve
- `gentleEase` - Custom gentle easing

```tsx
<motion.div animate={{ x: 100 }} transition={gentleSpring}>
  Content
</motion.div>
```

## Best Practices

1. **Use AnimatePresence** for enter/exit animations
2. **Prefer variants** over inline animation objects
3. **Use stagger** for lists and multiple elements
4. **Keep animations gentle** - avoid overly dramatic effects
5. **Test on mobile** - ensure animations perform well
6. **Combine animations** thoughtfully - don't overdo it

## Performance Tips

- Use `will-change: transform` CSS for heavy animations
- Prefer `transform` and `opacity` changes over layout properties
- Use `layout` prop sparingly for layout animations
- Consider `reduced-motion` preferences for accessibility

## Browser Support

All animations work with:

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Gracefully degrades on older browsers.
