# Links Module

Email-centric shareable link management with branding, permissions, and password protection.

## Overview

The Links module enables users to create shareable upload endpoints with customizable branding, access control, and configuration options.

## Architecture

### Components
- **CreateLinkForm** - Multi-step link creation (1,011 lines, tabs + accordion UI)
- **LinkDetailsModal** - View link details and configuration
- **CreateLinkModal** - Modal wrapper for link creation
- **ColorPickerInput** - Hex color picker with popover
- **MultiEmailInput** - Chip-based email input with validation
- **LinksManagementBar** - Bulk actions and link management

### Actions
**Global** (`src/lib/actions/`):
- `createLinkAction()` - Create new link with validation
- `getLinkByIdAction()` - Fetch link details
- `updateLinkAction()` - Update link configuration
- `deleteLinkAction()` - Delete link (preserves content)
- `validateLinkSlugAction()` - Check slug availability
- `getLinksByWorkspaceAction()` - List workspace links
- `addPermissionAction()`, `removePermissionAction()` - Permission management

**Module** (`src/modules/links/lib/actions/`):
- `updateBrandingAction()` - Update colors and branding
- `uploadBrandingLogoAction()` - Upload logo (5MB limit, PNG/JPEG/WebP)
- `deleteBrandingLogoAction()` - Remove logo

### Validation
**Global** (`src/lib/validation/`):
- `link-schemas.ts` - CRUD operations and core fields
- `permission-schemas.ts` - Permission management

**Module** (`src/modules/links/lib/validation/`):
- `link-branding-schemas.ts` - Branding validation (colors, logo)
- `link-form-schemas.ts` - Form validation with conditional logic

## Features

### Link Configuration
- **Name & Slug** - Custom naming with unique slug validation
- **Visibility** - Public (anyone) vs Dedicated (whitelist only)
- **Password Protection** - Optional password requirement
- **Expiration** - Optional link expiration date
- **Notifications** - Email notifications on upload
- **Custom Message** - Welcome message for uploaders
- **Name Requirement** - Require uploader name

### Branding
- **Logo Upload** - Custom logo (5MB max, PNG/JPEG/WebP)
- **Accent Color** - Primary brand color (6-digit hex)
- **Background Color** - Upload page background (6-digit hex)
- **Storage** - GCS bucket with signed URLs

### Permissions
- **Owner** - Full control (auto-created with link)
- **Editor** - Delete files, requires OTP verification
- **Uploader** - Upload only (default for external users)

## Usage

### Create Link
```typescript
import { useCreateLink } from '@/hooks';

const { mutate: createLink } = useCreateLink();

createLink({
  name: 'Tax Documents 2024',
  slug: 'tax-2024',
  isPublic: false,
  passwordProtected: true,
  password: 'secure123',
  expiresAt: '2024-12-31T23:59:59Z',
});
```

### Update Branding
```typescript
import { useUpdateBranding } from '@/modules/links/hooks';

const { mutate: updateBranding } = useUpdateBranding();

updateBranding({
  linkId: 'link-id',
  accentColor: '#6c47ff',
  backgroundColor: '#ffffff',
});
```

### Add Permission
```typescript
import { useAddPermission } from '@/hooks';

const { mutate: addPermission } = useAddPermission();

addPermission({
  linkId: 'link-id',
  email: 'user@example.com',
  role: 'uploader',
});
```

## Testing

- **262 total tests** across 13 suites
- **Link Actions**: 18 tests (CRUD, validation)
- **Permission Actions**: 23 tests (add, remove, update, get)
- **Branding Actions**: 17 tests (logo upload, colors)

Run tests: `npm test src/modules/links`

## Related Documentation

- [CLAUDE.md](../../../CLAUDE.md) - Project architecture
- [Validation Pattern](../../../docs/execution/patterns/validation-organization-pattern.md)
- [Database Schema](../../../docs/execution/database/schema.md)
