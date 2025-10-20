# MVP Feature List (Phase 1)

Last Updated: October 8, 2025

**Goal:** Ship a functional email-centric file collection platform that delivers the core "tax accountant with 30 clients" use case.

**Timeline:** 6-8 weeks
**Success Criteria:** User can create folders, generate shareable links, track uploads by email, and filter files

---

## Priority 1: MUST HAVE (Core Functionality)

These features are non-negotiable for MVP launch.

### 1.1 Authentication & User Management

**User Stories:**
- As a user, I want to sign up with email/password so I can create my account
- As a user, I want to log in securely so I can access my files
- As a user, I want to reset my password if I forget it

**Technical Requirements:**
- ✅ Clerk authentication integration
- ✅ Email/password auth
- ✅ Magic link login (optional for MVP)
- ✅ Password reset flow
- ✅ User profile creation
- ✅ Onboarding flow to capture username
- ✅ Auto-generate first link after onboarding (e.g., `foldly.com/{username}`)

**Acceptance Criteria:**
- [ ] User can sign up in < 30 seconds
- [ ] User receives confirmation email
- [ ] User completes onboarding (enters username)
- [ ] User can log in and see dashboard
- [ ] First link auto-created with username after onboarding

---

### 1.2 Folder Management

**User Stories:**
- As a user, I want to create folders to organize my files
- As a user, I want to create subfolders for better organization
- As a user, I want to rename folders
- As a user, I want to delete folders

**Technical Requirements:**
- ✅ Create personal folders
- ✅ Create subfolders (nested hierarchy)
- ✅ Rename folders
- ✅ Delete folders (cascade delete with confirmation)
- ✅ Move folders (drag-and-drop or move modal)
- ✅ Database: `folders` table with `parent_folder_id` for hierarchy

**Acceptance Criteria:**
- [ ] User can create unlimited folders
- [ ] Folders support nesting up to 5 levels
- [ ] Deletion shows confirmation with item count
- [ ] Moving folders preserves permissions

---

### 1.3 Shareable Link Generation

**User Stories:**
- As a user, I want to generate a shareable link for any folder
- As a user, I want to toggle a folder between personal and shared
- As a user, I want to customize the link URL (optional slug)

**Technical Requirements:**
- ✅ Toggle "Generate Link" on any folder
- ✅ Auto-generate unique link ID
- ✅ Support custom slugs (e.g., `foldly.com/username/taxes`)
- ✅ Link types: Public vs Dedicated
- ✅ Copy link to clipboard
- ✅ Database: `links` table with `folder_id`, `slug`, `is_public`

**Acceptance Criteria:**
- [ ] User can generate link in < 5 clicks
- [ ] Link works immediately after generation
- [ ] Link persists across folder renames
- [ ] Custom slugs validated for uniqueness

---

### 1.4 Email-Based Access Control

**User Stories:**
- As a user, I want to add specific emails to my shared folder
- As a user, I want to remove emails from access list
- As a user, I want to see who has access to each folder

**Technical Requirements:**
- ✅ Add emails to link (comma-separated or one-by-one)
- ✅ Remove emails from link
- ✅ View access list for each link
- ✅ Auto-append emails on first upload (public links only)
- ✅ Database: `permissions` table with `link_id`, `email`, `role`

**Acceptance Criteria:**
- [ ] User can add 30+ emails in bulk
- [ ] Removed emails blocked from future uploads
- [ ] Access list shows email + role + last activity
- [ ] Public links auto-add new uploaders

---

### 1.5 File Upload (External Uploader View)

**User Stories:**
- As an external user, I want to upload files via a link without creating an account
- As an external user, I want to see my upload progress
- As an external user, I want confirmation after successful upload

**Technical Requirements:**
- ✅ No-login upload page
- ✅ Drag-and-drop file upload
- ✅ Multi-file selection
- ✅ Upload progress bar
- ✅ File size validation (max per file + total)
- ✅ Success/error messaging
- ✅ Store files in Google Cloud Storage
- ✅ Tag files with `uploader_email`, `link_id`, `uploaded_at`

**Metadata Collection:**
- Name (optional)
- Email (required for tracking)
- Message (optional)

**Acceptance Criteria:**
- [ ] Upload page loads in < 2 seconds
- [ ] Supports files up to 100 MB each
- [ ] Shows real-time progress
- [ ] Works on mobile browsers
- [ ] Email validation before upload

---

### 1.6 File Management (Owner View)

**User Stories:**
- As a user, I want to see all files uploaded to my folders
- As a user, I want to download files
- As a user, I want to delete files
- As a user, I want to preview images/PDFs

**Technical Requirements:**
- ✅ List all files in folder
- ✅ Download individual files
- ✅ Delete files (with confirmation)
- ✅ Basic file preview (images, PDFs)
- ✅ File metadata display (name, size, uploaded_at, uploader_email)
- ✅ Bulk selection and download (ZIP)

**Acceptance Criteria:**
- [ ] Files display instantly after upload
- [ ] Download links work for all file types
- [ ] Deletion requires confirmation
- [ ] Preview works for common formats (JPG, PNG, PDF)

---

### 1.7 Email-Based Filtering

**User Stories:**
- As a user, I want to see all files uploaded by a specific email
- As a user, I want to filter files by email across all folders
- As a user, I want to filter files by email within a specific folder

**Technical Requirements:**
- ✅ "By Email" view in dashboard
- ✅ Filter: Show all files from `john@example.com` across ALL folders
- ✅ Filter: Show files from `john@example.com` in specific folder only
- ✅ Search box with email autocomplete
- ✅ Group files by email with expand/collapse

**UI Components:**
```
[Files] [By Email] [By Date]

Select [By Email]:
  📧 john@example.com (15 files) ▼
    ├─ 2024-Taxes/contract.pdf
    ├─ Client-Work/invoice.pdf
    └─ ...

  📧 jane@company.com (8 files) ▼
```

**Acceptance Criteria:**
- [ ] Email filter updates instantly (< 1 second)
- [ ] Clicking email expands/collapses files
- [ ] Shows file count per email
- [ ] Works with 100+ unique emails

---

### 1.8 Dashboard Views

**User Stories:**
- As a user, I want to see recent activity on my dashboard
- As a user, I want to switch between folder view and email view
- As a user, I want to search across all my files

**Technical Requirements:**
- ✅ Dashboard with multiple views:
  - **Files** (Google Drive-style grid: root folders + files, NOT tree structure)
  - **By Email** (group files by uploader email)
  - **By Date** (chronological file list)
- ✅ Recent activity feed (last 20 uploads)
- ✅ Search bar (search by filename, uploader email, folder name)
- ✅ Quick stats (total files, total storage used, active links)

**Acceptance Criteria:**
- [ ] Dashboard loads in < 2 seconds
- [ ] View switching is instant
- [ ] Search returns results in < 1 second
- [ ] Stats update in real-time

---

## Priority 2: SHOULD HAVE (Important but not blockers)

These features enhance the core experience but can be added post-MVP.

### 2.1 Role Promotion (Uploader → Editor)

**User Stories:**
- As a user, I want to promote specific emails to Editor role
- As an external user, I want to verify my email via OTP to become an Editor

**Technical Requirements:**
- ✅ Promote email to Editor
- ✅ Send OTP code to email
- ✅ Verify OTP
- ✅ Grant Editor permissions (delete others' files, manage content)

**Deferred to Phase 2?** Consider shipping MVP with just Owner/Uploader roles.

---

### 2.2 Email Invitations

**User Stories:**
- As a user, I want Foldly to email invitations to my access list
- As an invitee, I want to receive a personalized email with the upload link

**Technical Requirements:**
- ✅ "Send Invitations" button
- ✅ Email template with customizable message
- ✅ Track sent invitations
- ✅ Resend invitations

**Deferred to Phase 2?** MVP can launch with "copy link" only.

---

### 2.3 Notifications

**User Stories:**
- As a user, I want to be notified when someone uploads files
- As a user, I want to control notification preferences

**Technical Requirements:**
- ✅ Email notifications on new uploads
- ✅ In-app notification badge
- ✅ Notification settings page

**Deferred to Phase 2?** MVP can work without notifications.

---

### 2.4 Link Customization

**User Stories:**
- As a user, I want to customize the message on my upload page
- As a user, I want to add my logo to the upload page

**Technical Requirements:**
- ✅ Custom welcome message per link
- ✅ Upload branding (logo, colors)
- ✅ Configure required fields per link

**Deferred to Phase 2?** MVP uses default upload page.

---

## Priority 3: NICE TO HAVE (Future Features)

These features can wait until after MVP validation.

### 3.1 Cloud Storage Integration

- Sync files to Google Drive
- Sync files to Dropbox
- Sync files to OneDrive

### 3.2 Advanced Analytics

- Upload activity charts
- Most active contributors
- Storage breakdown by folder

### 3.3 Batch Operations

- Bulk delete files
- Bulk download as ZIP
- Bulk move files

### 3.4 Zapier Integration

- Webhook on new upload
- Trigger automations

### 3.5 Mobile Apps

- iOS app
- Android app

---

## MVP Feature Checklist

### Week 1-2: Foundation
- [x] Set up Next.js project (Next.js 15 + React 19)
- [x] Configure Supabase (database schema pushed)
- [ ] Configure Google Cloud Storage
- [x] Set up Clerk authentication (configured)
- [x] Build onboarding flow (username capture + auto-generation)
- [x] Create base UI components (shadcn/ui + custom CTA buttons)

### Week 3: User & Folder Management
- [ ] User signup/login flow
- [ ] Dashboard layout
- [ ] Create/edit/delete folders
- [ ] Folder hierarchy (subfolders)

### Week 4: Link Generation & Permissions
- [ ] Generate shareable links
- [ ] Add/remove emails to links
- [ ] Public vs Dedicated link types
- [ ] Copy link to clipboard

### Week 5: File Upload
- [ ] External uploader UI
- [ ] File upload to GCS
- [ ] Metadata collection (email, name)
- [ ] Upload progress tracking
- [ ] Success/error handling

### Week 6: File Management
- [ ] List files in folder
- [ ] Download files
- [ ] Delete files
- [ ] Basic file preview

### Week 7: Email Filtering
- [ ] "By Email" view
- [ ] Email-based filtering
- [ ] Search by email
- [ ] Cross-folder email queries

### Week 8: Polish & Testing
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Loading states
- [ ] User testing
- [ ] Bug fixes
- [ ] Performance optimization

---

## Success Metrics

**MVP is successful if:**
- ✅ User can create account in < 30 seconds
- ✅ User can generate shareable link in < 10 seconds
- ✅ External uploader can upload files without login
- ✅ User can filter all files from a specific email
- ✅ Platform handles 30+ unique uploaders per folder
- ✅ No critical bugs in core flows

**Next Phase Triggers:**
- 100+ active users
- 1000+ files uploaded
- Positive user feedback on email filtering
- Requests for Editor role feature
