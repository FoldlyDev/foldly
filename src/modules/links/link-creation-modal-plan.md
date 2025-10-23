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
3. Show live preview: `foldly.com/sarah/tax-documents-2024`
4. Slug is **read-only** (auto-generated, not editable by user)

**Transformation Logic:**
- Strip: special chars, emojis, extra spaces
- Replace spaces with hyphens
- Convert to lowercase
- Validate global uniqueness

**UX Decision:** Slug is read-only to avoid confusion since it's auto-generated from the link name. Users should focus on creating a good name, and the system handles URL generation.

## Required Fields for Creation

**Mandatory:**
- `name` - Display name (3-100 chars)
- `slug` - URL identifier (3-50 chars, auto-generated from name, read-only)

**Optional (with defaults):**
- `isPublic` - Link type (default: false = dedicated mode)
  - `true` = Public: Anyone can upload
  - `false` = Dedicated: Only allowed emails can upload

**Conditional:**
- Allowed emails (if `isPublic = false`) - Required for dedicated links
- Password (if `passwordProtected = true`) - Required when password protection enabled

## Implementation Decisions

### Modal Structure
**Component Location:**
```
src/modules/links/components/modals/CreateLinkModal.tsx
```

### UI Layout
**2 Tabs:**
1. **Basic Info** - Core link information (3 accordion sections)
2. **Branding** - Logo and colors (optional at creation)

**Tab 1: Basic Info (Accordion Structure)**

*Section 1: Basic Settings (expanded by default)*
- Link Name (required) - Auto-generates slug on change
- Link URL Preview (read-only) - Shows `foldly.com/username/{slug}` or placeholder
- Link Type Toggle - Public/Dedicated switch
- Allowed Emails (conditional, shows if Dedicated) - Multiple email input

*Section 2: Access Control (collapsed by default)*
- Password Protection Toggle - Enable/disable password requirement
- Password Input (conditional, shows if enabled) - Required password field

*Section 3: Advanced Options (collapsed by default)*
- Placeholder text: "Coming soon: Link expiration, file limits, and more"

**Tab 2: Branding**
- Logo upload (5MB max, PNG/JPEG/WebP) - FileUpload component
- Accent Color picker - Default: #6c47ff
- Background Color picker - Default: #ffffff

### Form Handling
- **Form Library**: React Hook Form
- **Validation**: Zod schemas from `src/modules/links/lib/validation/link-schemas.ts`
- **State**: TanStack Query mutation for `createLinkAction`

### Modal Control
- Triggered from `LinksManagementBar` primary action
- Uses `useModalState<Link>` pattern

## Implementation Plan

### Phase 1: UI Structure ✅ COMPLETE
- [x] Create `CreateLinkModal.tsx` component file
- [x] Create `CreateLinkForm.tsx` form component
- [x] Set up modal wrapper with AnimateUI Modal components
- [x] Install and configure AnimateUI Tabs component
- [x] Install and configure AnimateUI Accordion component
- [x] Build Basic Info tab with accordion structure (3 sections)
- [x] Build Branding tab layout
- [x] Install shadcn components (textarea, select)
- [x] Create custom inputs (MultiEmailInput, ColorPickerInput)
- [x] Fix modal responsiveness (width, scrolling, content clipping)
- [x] Convert slug field to read-only preview
- [x] Integrate with `useModalState` pattern in `UserLinks.tsx`

**Components Created:**
- `src/modules/links/components/modals/CreateLinkModal.tsx`
- `src/modules/links/components/forms/CreateLinkForm.tsx`
- `src/modules/links/components/inputs/MultiEmailInput.tsx`
- `src/modules/links/components/inputs/ColorPickerInput.tsx`

**UI Components Installed:**
- AnimateUI: Tabs, Accordion, Switch
- shadcn: Textarea, Select
- Custom: FileUpload (from aceternityui)

### Phase 2: Form Logic (Current Focus)
- [ ] Implement React Hook Form integration
- [ ] Add Zod validation schema
- [ ] Implement name → slug auto-generation logic
- [ ] Update live URL preview reactively
- [ ] Add form submission handler
- [ ] Handle branding file uploads
- [ ] Add password validation when enabled
- [ ] Add email validation for allowed emails list

### Phase 3: Integration (Final)
- [ ] Connect to `createLinkAction` server action
- [ ] Add TanStack Query mutation
- [ ] Handle loading states (disable form during submission)
- [ ] Handle error states (display validation errors)
- [ ] Handle success (close modal, invalidate queries, show toast)
- [ ] Add optimistic updates
- [ ] Test complete flow end-to-end

## Technical Decisions & Fixes

### Modal Responsiveness
**Problem:** Modal content clipping and scroll issues on mobile
**Solutions Applied:**
1. **Width Management:**
   - Mobile: `w-[calc(100%-3rem)] max-w-[calc(100%-3rem)]` (1.5rem margins)
   - Desktop: `sm:max-w-2xl` for wider form layout
2. **Scroll Handling:**
   - `max-h-[calc(100vh-3rem)]` prevents overflow beyond viewport
   - `overflow-y-auto` enables vertical scrolling for tall content
3. **Grid Layout Fix:**
   - `[&>*]:min-w-0` allows grid children to shrink below content width
   - Prevents horizontal clipping of long text/inputs
4. **Performance:**
   - `[transform:translate3d(-50%,-50%,0)]` for GPU acceleration
   - `will-change-transform` for smoother animations

### Slug Field Decision
**Initial Approach:** Editable input field for slug
**Problem:** Confusing UX since slug is auto-generated from name
**Final Decision:** Read-only preview display
**Benefits:**
- Clearer user mental model (focus on name, not URL)
- Eliminates mobile layout clipping issues
- Reduces potential for invalid slug entry
- Simpler form validation

### Accordion Structure
**Why Accordion over Simple Form:**
- Reduces visual complexity on initial view
- Groups related settings logically
- Allows progressive disclosure of advanced features
- Mobile-friendly (less scrolling with collapsed sections)

**Default States:**
- Basic Settings: **Expanded** (core required fields)
- Access Control: **Collapsed** (optional security)
- Advanced Options: **Collapsed** (future features)

### Component Architecture
**Modal Pattern:**
```typescript
// Parent component (UserLinks.tsx)
const createLinkModal = useModalState<void>();

// Modal component (CreateLinkModal.tsx)
<Modal open={isOpen} onOpenChange={onOpenChange}>
  <ModalContent className="sm:max-w-2xl gap-4">
    <ModalHeader>...</ModalHeader>
    <CreateLinkForm onSubmit={...} onCancel={...} />
  </ModalContent>
</Modal>
```

**Form Pattern:**
```typescript
// Controlled state for now (Phase 1)
// Will migrate to React Hook Form in Phase 2
const [linkName, setLinkName] = useState('');
const [slug, setSlug] = useState('');
const [isPublic, setIsPublic] = useState(false);
const [emails, setEmails] = useState<string[]>([]);
const [passwordProtected, setPasswordProtected] = useState(false);
const [password, setPassword] = useState('');
const [accentColor, setAccentColor] = useState('#6c47ff');
const [backgroundColor, setBackgroundColor] = useState('#ffffff');
```

### Conditional Rendering Logic
**Allowed Emails Input:**
```typescript
{!isPublic && (
  <MultiEmailInput
    value={emails}
    onChange={setEmails}
    placeholder="Enter email address..."
  />
)}
```
- Shows only when `isPublic = false` (dedicated mode)
- Uses custom MultiEmailInput component for tag-based email entry

**Password Input:**
```typescript
{passwordProtected && (
  <Input
    type="password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required={passwordProtected}
  />
)}
```
- Shows only when `passwordProtected = true`
- Required validation applied when visible

**URL Preview:**
```typescript
{slug ? (
  <>
    <span className="text-muted-foreground">foldly.com/username/</span>
    <span className="text-foreground">{slug}</span>
  </>
) : (
  <span className="text-muted-foreground italic">
    URL will be generated from link name
  </span>
)}
```
- Shows generated URL when slug exists
- Shows placeholder when empty

## Notes
- Keep creation simple to avoid overwhelming users
- Branding is optional but available at creation
- Advanced configuration can be added later via Edit modal
- Slug auto-generation happens client-side for instant preview
- Server validates slug uniqueness on submission
- Password protection independent of public/dedicated mode
- Document is editable as decisions evolve
