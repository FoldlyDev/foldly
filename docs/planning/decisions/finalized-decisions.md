# Finalized Architectural Decisions

Last Updated: October 8, 2025

## ✅ LOCKED DECISIONS (DO NOT CHANGE WITHOUT DISCUSSION)

### 1. Storage Architecture

**Decision:** Single Google Cloud Storage bucket with database-driven logical organization

**Rationale:**
- Simpler architecture
- Database acts as source of truth for all organization
- Avoids storage duplication complexity
- Easier quota management
- GCS handles high storage consumption better than Supabase Storage

**Implementation:**
```
Storage: gs://foldly-files/
  └── {owner_user_id}/
      └── {link_id}/
          └── {file_id}

Database manages:
  - Folder hierarchy
  - Personal vs shared context
  - Permissions
  - Email tagging
  - All logical organization
```

---

### 2. Link-Folder Relationship

**Decision:** Links ARE folders, differentiated with 🔗 icon in UI

**Rationale:**
- Simpler mental model for users
- Avoids parallel structures
- Folders can fluidly transition between personal ↔ shared contexts

**Rules:**
- Every link MUST have a folder
- Folders can exist without links (personal-only)
- Generating a link from a personal folder converts it to shared context
- Decoupling a link makes folder personal again (link becomes inactive)

---

### 3. Permission System

**Decision:** 3-tier role system: Owner / Editor / Uploader

| Role | Email Verification | Can Delete Others' Files | Manage Permissions | Default |
|------|-------------------|-------------------------|-------------------|---------|
| **Owner** | N/A | ✅ | ✅ | Link creator |
| **Editor** | ✅ OTP required | ✅ | ❌ | Manually granted |
| **Uploader** | ❌ | ❌ (own files only) | ❌ | Default for new uploaders |

**Editor Promotion Flow:**
1. Owner selects email in access list
2. Promotes to "Editor"
3. System sends OTP to email
4. User verifies via OTP code
5. Editor permissions activated

---

### 4. File Ownership Model

**Decision:** Link owner = absolute file owner

**Rules:**
- All files uploaded through a link belong to the link creator
- All uploads count toward link owner's quota (NOT uploader's quota)
- Uploaders are temporary contributors, not file owners
- When owner deletes a file, it disappears for everyone
- Simpler than Google Drive's multi-owner model

---

### 5. Email Tagging & Filtering

**Decision:** Tag every file with `uploader_email` and `link_id`

**Implementation:**
```sql
files table:
  - uploader_email VARCHAR (indexed)
  - uploader_name VARCHAR (from upload form, metadata only)
  - link_id UUID (indexed)
  - folder_id UUID
```

**Enables:**
- Filter all files by specific email across ALL folders/links
- Filter by email within specific folder
- Filter by email within specific link
- View all uploads from a specific person

**Persistence:**
- Email tags remain even when files move to personal context
- Tags preserved across folder moves
- Historical tracking of who uploaded what

---

### 6. Folder Deletion Behavior

**Decision:** Cascade delete with confirmation dialog

**Flow:**
```
User deletes linked folder →
  Confirmation: "This will delete:
    - Folder and all contents
    - Associated link (link becomes inactive)
    - All access permissions
    Continue?"

If confirmed →
  Delete folder + contents
  Delete link record
  Delete all permissions
  Notify affected users (optional)
```

---

### 7. Email Access List Management

**Decision:** Lenient model - keep files, block future uploads

**When email removed from access list:**
- ✅ Files uploaded by that email REMAIN in folder
- ❌ Future uploads from that email are BLOCKED
- ⚠️ Owner can manually delete files if needed

**Rationale:**
- Preserves data continuity
- Avoids accidental data loss
- Owner maintains control

---

### 8. Public Link Behavior

**Decision:** Auto-append first-time uploaders to access list

**Flow:**
1. Public link created
2. New uploader uploads files
3. Email automatically added to access list
4. If link switches to private later → that email KEEPS access
5. Owner can manually remove emails if needed

**Rationale:**
- Smoother continuity
- Preserves access when switching contexts
- Owner maintains manual override control

---

### 9. Subfolder Creation

**Decision:** External uploaders CAN create subfolders (based on permissions)

**Rules:**
- **Uploaders:** Can create subfolders, manage own files/folders only
- **Editors:** Can create subfolders, manage ALL files/folders
- **Owner:** Full control over entire hierarchy

**Ownership:**
- Subfolders created by uploaders still belong to link owner
- Count toward owner's quota
- Owner can delete any subfolder regardless of creator

---

### 10. Tech Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS
- shadcn/ui components

**Backend:**
- Supabase (PostgreSQL Database)
- Clerk (Auth + Payments via Stripe)
- Google Cloud Storage (File storage)
- Next.js API Routes / Server Actions

**Infrastructure:**
- Vercel (Deployment)
- Supabase (PostgreSQL database)
- GCS (File storage)
- Stripe (via Clerk)

---

### 11. Link Types

**Decision:** Two link types only

1. **Public Links**
   - Anyone with link can upload
   - First-time uploaders auto-added to access list
   - Can switch to Dedicated later (preserves existing access)

2. **Dedicated Links**
   - Email-bound (specific emails only)
   - Unauthorized emails blocked
   - Can switch to Public later (opens access)

**Auto-First-Link:**
- On account creation, auto-generate first link (like Calendly)
- Named with username: `foldly.com/{username}`
- User can edit, delete, or create more links

---

### 12. Link URL Structure

**Decision:** Hybrid approach - `foldly.com/{username}/{folder-slug}`

**Structure:**
```
Primary link (auto-generated on signup):
  foldly.com/sarahtax

Additional folder links:
  foldly.com/sarahtax/2024-taxes
  foldly.com/sarahtax/client-work
  foldly.com/sarahtax/john-smith
```

**Implementation:**
- Username must be unique (validated on signup)
- Folder slugs must be unique per user (not globally)
- Auto-generate slug from folder name: "2024 Taxes" → "2024-taxes"
- Allow custom slug editing
- URL routing: `/{username}` and `/{username}/{slug}`

**Rationale:**
- Professional and memorable (like Calendly)
- Supports unlimited folders per user (tax accountant with 30 clients)
- Hierarchical and intuitive
- Easy to share verbally: "Go to foldly.com/sarahtax/taxes"
- SEO-friendly (username = personal brand)

---

### 13. Upload Metadata Form

**Decision:** Email required, name optional, profile picture optional

**Upload Form Fields:**
```
Email * (required)
  [john@example.com]

Name (optional)
  [John Smith]

Profile Picture (optional)
  [Upload photo] or [Take photo]

Message (optional)
  [Adding my W-2 and receipts]
```

**Pre-filling Behavior:**
- If user came from email invitation → pre-fill email and name from invite
- If user came from direct link → empty form
- Allow editing pre-filled values

**Validation:**
- Email format validation (RFC 5322)
- Check against access list if link is Dedicated (private)
- Block upload if email not on access list
- Profile picture: max 5 MB, JPG/PNG only

**Rationale:**
- Email is critical for filtering (core feature)
- Name improves organization and UX
- Profile picture adds personalization
- Low friction (just email is required)

---

### 14. Multi-Folder Email Access

**Decision:** Hybrid model - per-folder permissions with global email tracking

**Database Structure:**
```sql
permissions table:
  - id (primary key)
  - link_id (foreign key → links)
  - email (indexed)
  - role (owner/editor/uploader)
  - created_at

Example:
  john@example.com → link_1 (2024 Taxes) → uploader
  john@example.com → link_2 (Client Work) → editor
  john@example.com → link_3 (Personal) → uploader
```

**Filtering Behavior:**
```
"By Email" view:
  Filter: [All Folders ▾]  [john@example.com ▾]

Shows all files from john@example.com across all folders:
  📧 john@example.com (15 files across 3 folders)
    ├─ 2024 Tax Season / W2-Form.pdf (uploader)
    ├─ Client Work / invoice.pdf (editor)
    └─ Personal / receipt.pdf (uploader)

Filter to specific folder:
  Filter: [2024 Tax Season ▾]

Shows only:
  📧 john@example.com (5 files in 2024 Tax Season)
```

**Rationale:**
- Granular permissions (different roles per folder)
- Global email tracking (cross-folder queries)
- Flexible filtering (all files OR specific folder)
- Supports the "30 clients" use case perfectly

---

### 15. Quota Enforcement

**Decision:** Hard limit at 100% with progressive warnings, NO grace period

**Flow:**
```
Free tier: 2 GB
Pro tier: 50 GB

At 80% (1.6 GB / 40 GB):
  → Dashboard warning:
     "⚠️ You're using 80% of your storage. Upgrade to Pro for more space."

At 90% (1.8 GB / 45 GB):
  → Dashboard banner:
     "⚠️ Storage almost full! You have 200 MB remaining."

At 100% (2 GB / 50 GB):
  → HARD BLOCK
  → Dashboard: "❌ Storage limit reached. Upgrade to continue receiving uploads."
  → Upload page shows: "❌ Storage full. Contact the owner to upload files."
  → New uploads are rejected
```

**External Uploader Experience:**
- At owner's 0-80%: Upload works, no warnings
- At owner's 80-99%: Upload works, no warnings to uploader
- At owner's 100%: Upload blocked immediately
  - Error message: "This folder's storage is full. Please contact [owner email]."

**Rationale:**
- Clear boundaries, no confusion
- Forces users to manage storage or upgrade
- Prevents unexpected overages
- Simple to implement and understand
- Industry standard for freemium SaaS

---

### 16. Link Sharing Options

**Decision:** Copy link for MVP, advanced sharing for higher tiers

**MVP (Phase 1 - All tiers):**
```
Folder settings:
  📎 Share Link

  [Copy Link]
  ✓ Link copied to clipboard!

  foldly.com/sarahtax/2024-taxes
```

**Phase 2 (Pro/Team tiers):**
```
Share Link modal:

  Tabs: [Copy] [Email Invite] [QR Code] [Embed]

  [Email Invite]:
    Emails: [john@example.com, jane@company.com]
    Message: [Custom invitation text...]
    [Send Invitations]

  [QR Code]:
    [QR code image]
    [Download PNG]

  [Embed]:
    <iframe src="foldly.com/embed/sarahtax/2024-taxes"></iframe>
    [Copy Code]
```

**Tier Restrictions:**
- Free: Copy link only
- Pro: Copy link + Email invites
- Team: All features (QR, Embed)

**Rationale:**
- MVP focuses on core functionality
- Copy link is sufficient to validate demand
- Advanced sharing as upsell incentive
- Email invites most valuable for power users

---

### 17. UI Layout Style

**Decision:** Google Drive-style grid view with sidebar details panel (NOT tree view)

**Dashboard Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Foldly  [Search...]                    [+ New Folder]       │
├──────────────────────────────────────────────────────────────┤
│  [Files] [By Email] [By Date]                                │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐                │
│  │ 📁🔗  │  │ 📁    │  │ 📄    │  │ 📄    │                │
│  │ Taxes │  │ Notes │  │ W2.pdf│  │ 1099  │                │
│  │ 3 ppl │  │       │  │ 2.1MB │  │ 850KB │                │
│  └───────┘  └───────┘  └───────┘  └───────┘                │
│                                                               │
│  ┌───────┐  ┌───────┐  ┌───────┐                            │
│  │ 📁🔗  │  │ 📄    │  │ 📄    │                            │
│  │ Client│  │Receipt│  │ Form  │                            │
│  │ 2 ppl │  │ 1.5MB │  │ 340KB │                            │
│  └───────┘  └───────┘  └───────┘                            │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Click on item → Sidebar opens:**
```
┌──────────────────────────────┐
│  Details                  [×] │
├──────────────────────────────┤
│  📁🔗 2024 Tax Season        │
│                              │
│  Type: Shared Folder         │
│  Link: foldly.com/.../taxes  │
│  [Copy Link]                 │
│                              │
│  Status: Public              │
│  Files: 45                   │
│  Size: 12.3 GB              │
│                              │
│  Access: 3 people            │
│  📧 john@example.com         │
│  📧 jane@company.com         │
│  📧 bob@startup.io           │
│  [Manage Access]             │
│                              │
│  Last upload: 2 hours ago    │
│  Created: Jan 5, 2025        │
│                              │
│  [Open Folder] [Share]       │
└──────────────────────────────┘
```

**Right-click context menu:**
```
Show details
Open folder
Copy link
Manage access
Download
Delete
```

**Folder Icon Badges:**
- 🔗 badge for shared folders
- "Public" or "Private" label
- People count: "3 people"
- Upload indicator: "• New uploads"

**Rationale:**
- Familiar UX (everyone knows Google Drive)
- Immediate file visibility (no extra clicks)
- Scalable to thousands of files
- Grid view = easy scanning
- Sidebar details = comprehensive info without navigation
- Context menu = power user shortcuts

---

### 18. Batch Upload Sessions

**Decision:** Skip batching for MVP, add in Phase 2 if requested

**MVP Implementation:**
```sql
files table (no batch_id):
  - id
  - folder_id
  - uploader_email
  - uploader_name
  - link_id
  - filename
  - file_size
  - uploaded_at  ← Sufficient for chronological grouping
```

**UI Grouping by Time:**
```
📧 john@example.com (15 files)

  Today, 2:30 PM (3 files uploaded together)
  ├─ W2-Form.pdf
  ├─ 1099.pdf
  └─ Receipts.zip

  Yesterday, 4:15 PM (2 files)
  ├─ Contract.pdf
  └─ Invoice.pdf
```

**Rationale:**
- Simpler database schema
- Email grouping already provides organization
- Timestamp grouping provides implicit sessions
- Can add `batch_id` later if users request explicit session tracking
- Reduces MVP complexity

**Future Batching Benefits (Phase 2):**
- Explicit "upload session" grouping in UI
- Batch operations (delete session, download session as ZIP)
- Session-level metadata (notes, tags)
- Better tracking for multi-file uploads

---

### 19. Email Repositories Concept

**Decision:** Email repositories are linked folders optimized for single-person file collection

**Technical Reality:**
- Email repositories = linked folders (same database tables, same functionality)
- No separate implementation or data structure
- "Email repository" is a UX concept, not a technical distinction

**User Workflows:**

**Workflow 1: Personal Folder**
```
[+ New Folder] →
  Creates folder WITHOUT link (personal storage)
  User can optionally generate link later
  Use case: Private files, drafts, personal organization
```

**Workflow 2: File Collection (Email Repository)**
```
[+ Request Files] →
  Creates folder WITH link automatically
  Pre-configured for receiving uploads
  Use case: Collecting files from others
```

**Rationale:**
- Clear mental model: Personal vs Shared
- Same backend, different creation paths
- Optimized UX for common use cases

**Note:** "Request Files" is the chosen UI label (subject to refinement during design phase)

---

### 20. Folder Naming Convention

**Decision:** User-defined folder names (never auto-update)

**Folder Creation Flow:**
```
Creating email repository for john@example.com:

Modal:
  Email: [john@example.com]

  Folder name: [john@example.com]  ← Default suggestion, fully editable

  Slug: [john-at-example-com]  ← Auto-generated from folder name

  [Create]
```

**Folder Name Control:**
- User types folder name (or accepts default)
- Folder name NEVER auto-updates
- Email tracked in database for filtering
- Uploader name captured as metadata (not used for folder naming)

**Suggested Naming Patterns (shown as UI hint):**
- Person's name: "John Smith"
- Company name: "Acme Corp"
- Project context: "Client - 2024 Taxes"
- Email as fallback: "john@example.com"

**Database Structure:**
```sql
folders:
  - id
  - name (user-defined, immutable unless manually changed)
  - slug (generated from name)
  - owner_id

files:
  - uploader_email (tracked for filtering)
  - uploader_name (metadata only, from upload form)
```

**Rationale:**
- User has full control (no surprises)
- Prevents inappropriate auto-naming
- Email filtering works independently of folder names
- Clean separation of concerns

---

### 21. Dashboard Tab Naming

**Decision:** "Files" as default view tab name

**Tab Structure:**
```
[Files] [By Email] [By Date]
 ━━━━━
 Default
```

**Tab Descriptions:**

**[Files]:**
- Shows user's root-level folders and files (Google Drive-style grid layout)
- Immediate visibility of all items
- Click folder → navigate inside
- Click file → open sidebar details

**[By Email]:**
- Groups all files by uploader email
- Cross-folder filtering
- Perfect for "show me all files from john@example.com"

**[By Date]:**
- Chronological file list
- Recent activity tracking

**Rationale:**
- "Files" is clean, simple, and professional
- Clearly describes the view without being derivative
- Works for both casual and business users
- Avoids confusion with other navigation patterns

**Alternatives Considered:**
- "My Drive" - Too similar to Google Drive
- "All Files" - Clear but slightly generic
- "My Space" - Too casual for business use
- "All" - Too vague (all what?)

---

## Summary Table

| Decision | Choice | Status |
|----------|--------|--------|
| Storage | Single GCS bucket | ✅ Locked |
| Link-Folder Model | Links = Folders with 🔗 icon | ✅ Locked |
| Roles | Owner / Editor / Uploader | ✅ Locked |
| Ownership | Link owner = file owner | ✅ Locked |
| Email Tagging | Tag every file | ✅ Locked |
| Deletion | Cascade delete | ✅ Locked |
| Removed Emails | Keep files, block uploads | ✅ Locked |
| Public Links | Auto-append emails | ✅ Locked |
| Subfolders | Uploaders can create | ✅ Locked |
| Link Types | Public + Dedicated | ✅ Locked |
| Tech Stack | Next.js + Supabase + GCS | ✅ Locked |
| Link URLs | `/{username}/{folder-slug}` | ✅ Locked |
| Upload Metadata | Email required + name + profile pic | ✅ Locked |
| Multi-Folder Access | Hybrid (per-folder + global tracking) | ✅ Locked |
| Quota | Hard limit at 100%, no grace period | ✅ Locked |
| Link Sharing | Copy link (MVP), advanced (Pro/Team) | ✅ Locked |
| UI Layout | Google Drive-style grid + sidebar | ✅ Locked |
| Batch Sessions | Skip for MVP | ✅ Locked |
| Email Repositories | UX concept (linked folders) | ✅ Locked |
| Folder Naming | User-defined, never auto-update | ✅ Locked |
| Dashboard Tabs | "Files" default | ✅ Locked |

---

## Change Log

| Date | Decision | Changed From | Changed To | Reason |
|------|----------|--------------|------------|--------|
| 2025-10-08 | Storage | Dual Supabase buckets | Single GCS bucket | Higher storage capacity, simpler architecture |
| 2025-10-08 | Role Names | Contributor/Collaborator | Uploader/Editor | Clearer intent for non-technical users |
| 2025-10-08 | Public Links | Strict (no auto-add) | Auto-append emails | Better UX and continuity |
| 2025-10-08 | Link URLs | N/A (new decision) | `/{username}/{slug}` | Professional, memorable, scalable |
| 2025-10-08 | Upload Form | Name + Email optional | Email required + profile pic | Email critical for filtering |
| 2025-10-08 | Quota | Grace period | Hard limit at 100% | Clear boundaries, no confusion |
| 2025-10-08 | UI Layout | Tree view | Google Drive grid view | Familiar UX, immediate visibility |
| 2025-10-08 | Batch Sessions | Included | Deferred to Phase 2 | Reduced MVP complexity |
| 2025-10-08 | Folder Naming | Auto-update with uploader name | User-defined only | User control, prevents confusion |
| 2025-10-08 | Dashboard Tabs | "By Folder" → "My Drive" | "Files" | Clean, simple, not derivative of Google Drive |
