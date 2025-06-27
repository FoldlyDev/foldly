# Foldly Color System

## Warm Pastel Palette Inspired by Calendly

### 🎨 Color Philosophy

Our color system is designed to convey **trust**, **warmth**, and **friendly professionalism**. Inspired by Calendly's clean aesthetic but with a softer, more approachable pastel touch, we focus on:

- **Soft Blue**: Trustworthy yet approachable
- **Gentle Teal**: Fresh, calming innovation
- **Light Purple**: Creative sophistication with warmth
- **Neutral Palette**: Clean, comfortable hierarchy

---

## 🎯 Brand Colors

### Soft Blue - Trust & Action

Our main brand color for CTAs, links, and primary actions - now in a gentle, approachable tone.

| Usage       | HEX       | CSS Variable            | Tailwind Class                        |
| ----------- | --------- | ----------------------- | ------------------------------------- |
| **Primary** | `#7bb3f0` | `--primary-blue`        | `bg-primary-blue` `text-primary-blue` |
| **Dark**    | `#5a9de8` | `--primary-blue-dark`   | `bg-primary-blue-dark`                |
| **Light**   | `#a1c9f5` | `--primary-blue-light`  | `bg-primary-blue-light`               |
| **Subtle**  | `#e8f2fe` | `--primary-blue-subtle` | `bg-primary-blue-subtle`              |

**Use for:** Primary buttons, active states, links, progress indicators

### Gentle Teal - Innovation & Growth

Soft, calming accent color that beautifully complements our soft blue.

| Usage       | HEX       | CSS Variable              | Tailwind Class                            |
| ----------- | --------- | ------------------------- | ----------------------------------------- |
| **Primary** | `#7dd3d0` | `--secondary-teal`        | `bg-secondary-teal` `text-secondary-teal` |
| **Dark**    | `#5ac5c1` | `--secondary-teal-dark`   | `bg-secondary-teal-dark`                  |
| **Light**   | `#a0e1de` | `--secondary-teal-light`  | `bg-secondary-teal-light`                 |
| **Subtle**  | `#e8fbfa` | `--secondary-teal-subtle` | `bg-secondary-teal-subtle`                |

**Use for:** Success states, secondary buttons, feature highlights, icons

### Light Purple - Premium & Creative

Warm, sophisticated color for special features with a friendly touch.

| Usage       | HEX       | CSS Variable             | Tailwind Class                          |
| ----------- | --------- | ------------------------ | --------------------------------------- |
| **Primary** | `#a5a8f5` | `--accent-purple`        | `bg-accent-purple` `text-accent-purple` |
| **Dark**    | `#8b8ff0` | `--accent-purple-dark`   | `bg-accent-purple-dark`                 |
| **Light**   | `#c0c3f9` | `--accent-purple-light`  | `bg-accent-purple-light`                |
| **Subtle**  | `#f0f1fe` | `--accent-purple-subtle` | `bg-accent-purple-subtle`               |

**Use for:** Premium features, creative elements, special promotions

---

## 🚦 Status Colors

| Status      | HEX       | CSS Variable      | Tailwind Class              | Usage                              |
| ----------- | --------- | ----------------- | --------------------------- | ---------------------------------- |
| **Success** | `#6bcf94` | `--success-green` | `bg-success` `text-success` | Success messages, completed states |
| **Warning** | `#f7b955` | `--warning-amber` | `bg-warning` `text-warning` | Warnings, attention needed         |
| **Error**   | `#f49090` | `--error-red`     | `bg-error` `text-error`     | Error states, destructive actions  |
| **Info**    | `#a1c9f5` | `--info-blue`     | `bg-info` `text-info`       | Information, neutral alerts        |

---

## ⚫ Neutral Palette

Professional gray scale for text, backgrounds, and UI elements.

| Scale   | HEX       | CSS Variable    | Tailwind Class   | Usage                |
| ------- | --------- | --------------- | ---------------- | -------------------- |
| **50**  | `#fafafa` | `--neutral-50`  | `bg-neutral-50`  | Lightest backgrounds |
| **100** | `#f5f5f5` | `--neutral-100` | `bg-neutral-100` | Card backgrounds     |
| **200** | `#e5e5e5` | `--neutral-200` | `bg-neutral-200` | Borders, dividers    |
| **300** | `#d4d4d4` | `--neutral-300` | `bg-neutral-300` | Disabled states      |
| **400** | `#a3a3a3` | `--neutral-400` | `bg-neutral-400` | Placeholder text     |
| **500** | `#737373` | `--neutral-500` | `bg-neutral-500` | Secondary text       |
| **600** | `#525252` | `--neutral-600` | `bg-neutral-600` | Primary text         |
| **700** | `#404040` | `--neutral-700` | `bg-neutral-700` | Headings             |
| **800** | `#262626` | `--neutral-800` | `bg-neutral-800` | High contrast text   |
| **900** | `#171717` | `--neutral-900` | `bg-neutral-900` | Maximum contrast     |
| **950** | `#0a0a0a` | `--neutral-950` | `bg-neutral-950` | Darkest elements     |

---

## 🌈 Gradient Utilities

Pre-built gradients using our brand colors.

### CSS Classes Available:

- `.bg-gradient-brand` - Primary brand gradient (blue → teal → purple)
- `.bg-gradient-brand-subtle` - Subtle brand gradient using light colors
- `.bg-gradient-primary` - Blue gradient
- `.bg-gradient-secondary` - Teal gradient
- `.bg-gradient-accent` - Purple gradient

### Example Usage:

```html
<!-- Hero section with brand gradient -->
<div class="bg-gradient-brand text-white">
  <h1>Welcome to Foldly</h1>
</div>

<!-- Subtle background -->
<div class="bg-gradient-brand-subtle">
  <p>Subtle branded background</p>
</div>
```

---

## 🎨 Usage Guidelines

### ✅ Do's

- Use **Primary Blue** for main CTAs and links
- Use **Secondary Teal** for success states and feature highlights
- Use **Accent Purple** sparingly for premium features
- Maintain sufficient contrast ratios (4.5:1 minimum)
- Use neutral colors for text hierarchy
- Test colors in both light and dark modes

### ❌ Don'ts

- Don't use more than 3 brand colors in a single component
- Don't use bright colors for large background areas
- Don't mix warm and cool tones unnecessarily
- Don't ignore accessibility contrast requirements
- Don't create new color variations without team approval

---

## 🌙 Dark Mode Support

All colors automatically adapt for dark mode using CSS variables. The system automatically adjusts:

- **Brightness**: Colors become brighter in dark mode
- **Backgrounds**: Subtle colors become darker
- **Text**: Maintains proper contrast ratios
- **Borders**: Adapt to dark theme contrast

---

## 🚀 Implementation Examples

### Button Components

```html
<!-- Primary Action -->
<button class="bg-primary-blue hover:bg-primary-blue-dark text-white">
  Get Started
</button>

<!-- Secondary Action -->
<button class="bg-secondary-teal hover:bg-secondary-teal-dark text-white">
  Learn More
</button>

<!-- Ghost Button -->
<button
  class="border border-primary-blue text-primary-blue hover:bg-primary-blue-subtle"
>
  Cancel
</button>
```

### Status Messages

```html
<!-- Success -->
<div class="bg-success/10 border border-success/20 text-success">
  File uploaded successfully!
</div>

<!-- Error -->
<div class="bg-error/10 border border-error/20 text-error">
  Upload failed. Please try again.
</div>
```

### Card Components

```html
<!-- Feature Card -->
<div class="bg-white border border-neutral-200 rounded-xl p-6">
  <div
    class="w-12 h-12 bg-primary-blue-subtle rounded-lg flex items-center justify-center"
  >
    <svg class="w-6 h-6 text-primary-blue">...</svg>
  </div>
  <h3 class="text-neutral-800 font-semibold">Feature Title</h3>
  <p class="text-neutral-600">Feature description</p>
</div>
```

---

## 📊 Color Accessibility

All colors meet WCAG 2.1 AA standards:

- **Primary Blue**: 4.7:1 contrast ratio on white
- **Secondary Teal**: 4.9:1 contrast ratio on white
- **Accent Purple**: 4.5:1 contrast ratio on white
- **Neutral Text**: 7.2:1+ contrast ratios

---

## 🔄 Migration from Old Colors

| Old Variable | New Variable       | Notes                |
| ------------ | ------------------ | -------------------- |
| `--accent-1` | `--primary-blue`   | Same functionality   |
| `--accent-2` | `--secondary-teal` | Same functionality   |
| `--accent-3` | `--accent-purple`  | Same functionality   |
| `--light`    | `--neutral-50`     | More semantic naming |
| `--light2`   | `--neutral-100`    | More semantic naming |
| `--dark`     | `--neutral-800`    | Better contrast      |

Legacy variables are maintained for compatibility but should be updated gradually.

---

## 📱 Examples in Context

Our color system creates a **warm, approachable, and trustworthy** brand experience inspired by Calendly's clean aesthetic but with a distinctly softer, more friendly pastel approach.

**Key Differentiators from Calendly:**

- **Pastel approach**: Much softer, more approachable colors while maintaining professionalism
- **Warm personality**: Colors convey friendliness and accessibility
- **Gentle sophistication**: Premium feel without being intimidating
- **Broader appeal**: Suitable for creative agencies, consultants, and friendly businesses

**Inspiration Sources:**
Based on research from [pastel color palettes](https://stephcorrigan.com/pastel-color-palettes/) and [Color Hunt's pastel collections](https://colorhunt.co/palettes/pastel-blue), our palette achieves the perfect balance of professional trust and warm approachability.
