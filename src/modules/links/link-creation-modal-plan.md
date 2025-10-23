# Link Creation Modal - Implementation Plan

## Concept Clarifications

### What are Links?
- Shareable upload endpoints with pattern: `foldly.com/{username}/{slug}`
- Links ARE folders - they define where files get uploaded
- External users can upload files without accounts (tracked by email)

### Name vs Slug
**Link Name (Display):**
- Purpose: Human-readable label shown in UI
- Examples: "Tax Documents 2024", "Client Receipts & Invoices"
- Allows: Spaces, uppercase, special characters, emojis
- Where shown: Cards, lists, modal headers

**Slug (URL Identifier):**
- Purpose: URL-safe identifier for routing
- Examples: "tax-documents-2024", "client-receipts-invoices"
- Must be: Lowercase, hyphens, alphanumeric, globally unique
- Where used: Actual URL path (`foldly.com/sarah/tax-documents-2024`)

**Why Both?**
- Users create MULTIPLE links per account (unlike Calendly)
- Each link needs unique URL identifier
- Display name can change; slug is permanent identifier

### Auto-Generation Flow
1. User types name: "Tax Documents 2024"
2. System auto-generates slug: "tax-documents-2024"
3. Show live preview: `foldly.com/sarah/[tax-documents-2024]`
4. User can edit slug part if desired

**Transformation Logic:**
- Strip: special chars, emojis, extra spaces
- Replace spaces with hyphens
- Convert to lowercase
- Validate global uniqueness

## Required Fields for Creation

**Mandatory:**
- `name` - Display name (3-100 chars)
- `slug` - URL identifier (3-50 chars, auto-generated from name, editable)

**Optional (with defaults):**
- `isPublic` - Link type (default: false = dedicated mode)
  - `true` = Public: Anyone can upload
  - `false` = Dedicated: Only allowed emails can upload

**Conditional:**
- Multiple emails (if `isPublic = false`) for instant access list

## Implementation Decisions

### Modal Structure
**Component Location:**
```
src/modules/links/components/modals/CreateLinkModal.tsx
```

### UI Layout
**2 Tabs:**
1. **Basic Info** - Core link information
2. **Branding** - Logo and colors (optional at creation)

**Tab 1: Basic Info**
- Link Name (required) - Auto-generates slug
- Live URL Preview - Shows `foldly.com/username/[editable-slug]`
- Link Type Toggle - Public/Dedicated
- Email List Input (if Dedicated) - Multiple emails supported
- Advanced Options Placeholder (collapsed) - For future config options

**Tab 2: Branding**
- Logo upload (5MB max, PNG/JPEG/WebP)
- Colors (accent, background)

### Form Handling
- **Form Library**: React Hook Form
- **Validation**: Zod schemas from `src/modules/links/lib/validation/link-schemas.ts`
- **State**: TanStack Query mutation for `createLinkAction`

### Modal Control
- Triggered from `LinksManagementBar` primary action
- Uses `useModalState<Link>` pattern

## Implementation Plan

### Phase 1: UI Structure (Current Focus)
- [ ] Create `CreateLinkModal.tsx` component file
- [ ] Set up modal wrapper with AnimateUI Tabs
- [ ] Build Basic Info tab layout
- [ ] Build Branding tab layout
- [ ] Create form structure with React Hook Form

### Phase 2: Form Logic (Next)
- [ ] Implement name → slug auto-generation
- [ ] Add live URL preview
- [ ] Implement link type toggle
- [ ] Add conditional email input
- [ ] Add advanced options placeholder (collapsed)

### Phase 3: Integration (Final)
- [ ] Connect to `createLinkAction`
- [ ] Add form validation
- [ ] Handle loading/error states
- [ ] Integrate with LinksManagementBar
- [ ] Test complete flow

## Notes
- Keep creation simple to avoid overwhelming users
- Branding is optional but available at creation
- Advanced configuration can be added later via Edit modal
- Document is editable as decisions evolve
