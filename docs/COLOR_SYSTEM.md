# Foldly Color System Documentation

## Overview

Foldly uses a sophisticated dark professional color system with semantic naming conventions. This approach ensures consistency, maintainability, and optimal user experience across all components.

## Design Philosophy

- **Dark Professional Theme**: Sophisticated color palette optimized for modern UI
- **Semantic Naming**: Colors named by purpose (primary, secondary, etc.) rather than color names
- **Dynamic & Maintainable**: Easy to update entire system by changing base values
- **UX/UI Optimized**: Carefully selected colors for maximum readability and visual hierarchy

## Core Brand Colors

### Primary Colors - Light Blue Accent

**Purpose**: Main CTAs, highlights, interactive elements, brand recognition

- **Primary**: `#C3E1F7` - Light blue for primary actions and key highlights
- **Primary Dark**: `#9ABEDE` - Hover states, pressed buttons
- **Primary Light**: `#E1F0FC` - Light interactions, subtle highlights
- **Primary Subtle**: `#F0F8FE` - Backgrounds, very subtle highlights

### Secondary Colors - Medium Blue

**Purpose**: Secondary actions, accents, supporting elements

- **Secondary**: `#9ABEDE` - Medium blue for secondary actions
- **Secondary Dark**: `#7BA5C7` - Hover states
- **Secondary Light**: `#B8D1E8` - Light interactions
- **Secondary Subtle**: `#E8F3FA` - Backgrounds

### Tertiary Colors - Dark Blue

**Purpose**: Text, borders, important structural elements

- **Tertiary**: `#2D4F6B` - Dark blue for important text and borders
- **Tertiary Dark**: `#1E3A52` - Darker variant
- **Tertiary Light**: `#4A6B85` - Lighter variant
- **Tertiary Subtle**: `#E6EDF3` - Light background

### Quaternary Colors - Very Dark Blue

**Purpose**: Main text, headings, high-importance content

- **Quaternary**: `#0F1922` - Very dark blue for main text and headings
- **Quaternary Dark**: `#0A0D0F` - Darkest variant
- **Quaternary Light**: `#1A2A35` - Lighter variant
- **Quaternary Subtle**: `#F5F6F7` - Light background

### Quinary Colors - Near Black

**Purpose**: Maximum contrast, dark backgrounds, ultimate hierarchy

- **Quinary**: `#0A0D0F` - Near black for maximum contrast
- **Quinary Dark**: `#050607` - Darkest possible
- **Quinary Light**: `#1A1D20` - Lighter variant
- **Quinary Subtle**: `#F8F9F9` - Light background

## Typography Hierarchy

### Optimal Color Usage for Text Elements

- **Main Titles/H1**: `var(--quaternary)` - Strong presence without being harsh
- **Section Headings/H2**: `var(--tertiary)` - Clear hierarchy, professional
- **Subheadings/H3**: `var(--tertiary-light)` - Readable secondary hierarchy
- **Body Text**: `var(--neutral-600)` - Optimal reading experience
- **Secondary Text**: `var(--neutral-500)` - Supporting information
- **Placeholder Text**: `var(--neutral-400)` - Non-intrusive hints
- **Captions/Small Text**: `var(--neutral-500)` - Subtle but readable

## Interactive Elements

### Call-to-Action (CTA) Guidelines

- **Primary CTAs**: Background `var(--primary)`, Text `var(--quaternary)`
- **Secondary CTAs**: Background `var(--secondary)`, Text `var(--quaternary)`
- **Tertiary CTAs**: Border `var(--tertiary)`, Text `var(--tertiary)`
- **Hover States**: Use `-dark` variants for backgrounds
- **Active States**: Use `-dark` variants with slight opacity

### Button Color Standards

```css
/* Primary Button */
.btn-primary {
  background: var(--primary);
  color: var(--quaternary);
  border: 1px solid var(--primary);
}

.btn-primary:hover {
  background: var(--primary-dark);
  border-color: var(--primary-dark);
}

/* Secondary Button */
.btn-secondary {
  background: var(--secondary);
  color: var(--quaternary);
  border: 1px solid var(--secondary);
}

/* Tertiary/Outline Button */
.btn-tertiary {
  background: transparent;
  color: var(--tertiary);
  border: 1px solid var(--tertiary);
}
```

## Status & Feedback Colors

### System Status Colors

- **Success**: `#10b981` - Confirmations, successful actions
- **Warning**: `#f59e0b` - Cautions, important notices
- **Error**: `#ef4444` - Errors, destructive actions
- **Info**: `var(--primary)` - Information, neutral notifications

## Accessibility & Contrast

### Contrast Guidelines

- **AA Compliance**: All text combinations meet WCAG AA standards (4.5:1 minimum)
- **AAA Target**: Critical text aims for AAA compliance (7:1 ratio)
- **Interactive Elements**: Minimum 3:1 contrast for UI components

### High Contrast Combinations

- **Maximum Readability**: `var(--quinary)` on `var(--neutral-50)`
- **Strong Hierarchy**: `var(--quaternary)` on `var(--neutral-100)`
- **Subtle Contrast**: `var(--tertiary)` on `var(--neutral-50)`

## Implementation Guidelines

### CSS Variable Usage

```css
/* Use semantic variables, not hardcoded colors */
.hero-title {
  color: var(--quaternary); /* ✅ Correct */
  /* color: #0F1922; ❌ Avoid hardcoding */
}

.cta-button {
  background: var(--primary);
  color: var(--quaternary);
}

.cta-button:hover {
  background: var(--primary-dark);
}
```

### Component-Specific Applications

#### Cards & Containers

- **Card Backgrounds**: `var(--neutral-50)` or `var(--primary-subtle)`
- **Card Borders**: `var(--neutral-200)` or `var(--tertiary-subtle)`
- **Card Shadows**: `var(--shadow-brand)` for brand-colored shadows

#### Navigation & Layout

- **Navigation Background**: `var(--neutral-50)` or `var(--quaternary-subtle)`
- **Navigation Text**: `var(--tertiary)` for normal, `var(--quaternary)` for active
- **Dividers**: `var(--neutral-200)` or `var(--tertiary-subtle)`

#### Forms & Inputs

- **Input Backgrounds**: `var(--neutral-50)`
- **Input Borders**: `var(--neutral-300)` normal, `var(--primary)` focus
- **Input Text**: `var(--quaternary)`
- **Labels**: `var(--tertiary)`
- **Placeholders**: `var(--neutral-400)`

## Dark Mode Considerations

The color system includes automatic dark mode variants:

- Colors automatically adjust for dark backgrounds
- Text colors invert appropriately
- Contrast ratios maintained across themes
- Brand colors remain recognizable in both modes

## Maintenance & Updates

### Updating Colors

1. Modify base color values in `src/app/globals.css`
2. All components automatically inherit changes
3. Test contrast ratios after updates
4. Update this documentation

### Adding New Colors

1. Follow semantic naming convention
2. Include all variants (base, dark, light, subtle)
3. Test accessibility compliance
4. Document usage guidelines

## Tools & Resources

### Development Tools

- **Contrast Checker**: WebAIM Contrast Checker
- **Color Picker**: Browser DevTools
- **Accessibility**: axe DevTools

### Design Tokens

All colors are available as:

- CSS Custom Properties (`var(--primary)`)
- Tailwind Classes (`text-primary`, `bg-secondary`)
- Design Token exports for Figma

---

_Last Updated: January 2025_
_Color System Version: 2.0 - Dark Professional Theme_
