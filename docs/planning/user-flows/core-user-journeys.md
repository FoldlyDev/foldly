# Core User Journeys

Last Updated: October 8, 2025

This document outlines the primary user flows for Foldly V2.

---

## Journey 1: Tax Accountant with 30 Clients (The Flagship Use Case)

**User:** Sarah, Tax Accountant
**Goal:** Manage document collection from 30 clients for 2024 tax season
**Pain Point:** Currently uses 7 email accounts, files lost in threads, chaos

### Flow

```
1. Sarah signs up for Foldly
   ↓
2. Account created → Auto-generates first link: foldly.com/sarahtax
   ↓
3. Dashboard shows: [+ New Folder]
   ↓
4. Sarah creates folder: "2024 Tax Season"
   ↓
5. Toggles "🔗 Make shareable"
   ↓
6. Adds 30 client emails in bulk:
   [Add Emails]
   john@gmail.com
   jane@company.com
   bob@startup.io
   ... (30 total)

   [Send Invitations]
   ↓
7. Foldly sends 30 personalized emails:
   "Sarah invited you to upload files to '2024 Tax Season'"
   [Upload Files] button → unique link per person
   ↓
8. Clients upload files throughout January
   ↓
9. Sarah's dashboard shows:

   [By Email] view:
   📧 john@gmail.com (5 files)
     ├─ W2-Form.pdf
     ├─ 1099-MISC.pdf
     └─ ...

   📧 jane@company.com (3 files)
   📧 bob@startup.io (12 files)

   [Files] view:
   📁🔗 2024 Tax Season (120 files total)
     ├─ john@gmail.com/
     ├─ jane@company.com/
     └─ bob@startup.io/

   ↓
10. Sarah needs to find "john's W2":
    - Clicks [By Email]
    - Selects john@gmail.com
    - Sees only John's files
    - Downloads W2-Form.pdf

    Alternative:
    - Searches "john W2"
    - Instant results filtered by uploader
   ↓
11. Mid-season, Sarah adds 5 more clients:
    - Opens "2024 Tax Season" folder
    - [Add Emails]
    - Adds 5 new emails
    - [Send Invitations]
    - New clients get access immediately
   ↓
12. One client (bob@startup.io) needs Editor access:
    - Sarah clicks bob's email
    - [Promote to Editor]
    - Bob receives OTP code
    - Bob verifies email
    - Bob can now delete/reorganize files
```

**Key Features Used:**
- ✅ Bulk email invitations
- ✅ Email-based file organization
- ✅ By Email filtering
- ✅ Role promotion (Uploader → Editor)
- ✅ Mid-season access additions
- ✅ Search with email filter

---

## Journey 2: Freelance Designer Requesting Client Assets

**User:** Mike, Freelance Designer
**Goal:** Request logo files, brand assets, and images from client
**Current Problem:** Email attachments lost, version confusion

### Flow

```
1. Mike logs into Foldly
   ↓
2. Dashboard: [+ New Folder]
   ↓
3. Creates folder: "Acme Corp - Brand Refresh"
   ↓
4. Toggles "🔗 Generate shareable link"
   ↓
5. Adds client email: marketing@acmecorp.com
   ↓
6. Customizes upload page:
   [Link Settings]
   - Custom message: "Please upload current logo, brand guidelines, and any product photos"
   - Required fields: ☑ Name ☑ Email ☐ Message
   ↓
7. Sends link via Foldly or copies to email:
   Option A: [Send Invitation] → Foldly emails client
   Option B: [Copy Link] → Mike pastes in email
   ↓
8. Client visits link:
   foldly.com/mikedesigns/acme-corp

   Sees:
   "Mike is requesting files for: Acme Corp - Brand Refresh"
   "Please upload current logo, brand guidelines, and any product photos"

   [Name]: Sarah Johnson
   [Email]: marketing@acmecorp.com
   [Drag files here]
   [Upload]
   ↓
9. Client uploads 8 files:
   - AcmeLogo-2024.ai
   - BrandGuidelines.pdf
   - ProductPhoto1.jpg
   - ... etc
   ↓
10. Mike receives notification:
    "Sarah Johnson uploaded 8 files to 'Acme Corp - Brand Refresh'"
    ↓
11. Mike views files:
    📁🔗 Acme Corp - Brand Refresh
      └─ marketing@acmecorp.com/ (8 files)
    ↓
12. Week later, Mike needs more files:
    - Sends same link again
    - Client uploads 3 more files
    - All files grouped under marketing@acmecorp.com
    - Mike sees both upload sessions
```

**Key Features Used:**
- ✅ Custom upload page messaging
- ✅ Branded link
- ✅ Email tracking
- ✅ Session continuity (same email, multiple uploads)
- ✅ Notifications

---

## Journey 3: HR Manager Collecting Resumes

**User:** Jennifer, HR Manager
**Goal:** Collect resumes from 50+ job applicants
**Current Problem:** Email overload, lost attachments, no organization

### Flow

```
1. Jennifer creates folder: "Software Engineer - Q1 2025"
   ↓
2. Makes link public (anyone can upload)
   [Link Type]: Public
   ↓
3. Posts link on job board:
   "Apply here: foldly.com/acmehr/software-engineer-q1"
   ↓
4. Applicants upload resumes:
   - john@gmail.com uploads resume.pdf
   - jane@yahoo.com uploads JaneDoe-Resume.pdf
   - ... (50 applicants)
   ↓
5. Foldly auto-adds each email to access list on first upload
   (per finalized decision: auto-append)
   ↓
6. Jennifer's dashboard:
   📁🔗 Software Engineer - Q1 2025 (50 files)

   [By Email] view:
   📧 john@gmail.com (1 file)
   📧 jane@yahoo.com (1 file)
   ... (50 total)
   ↓
7. Jennifer shortlists 10 candidates:
   - Promotes 10 emails to Editor
   - Sends message: "Please upload references and portfolio"
   - OTP verification sent
   ↓
8. Shortlisted candidates verify and upload additional files
   ↓
9. Jennifer filters:
   [Show only: Editors]
   → Sees only shortlisted candidates' files
   ↓
10. After hiring, Jennifer switches link to Private:
    [Link Type]: Public → Dedicated
    - Existing 50 emails keep access (per auto-append rule)
    - New uploads blocked unless email on list
```

**Key Features Used:**
- ✅ Public links
- ✅ Auto-append emails
- ✅ Role filtering
- ✅ Public → Private transitions
- ✅ Bulk access management

---

## Journey 4: External Uploader (File Sender)

**User:** Tom (Client)
**Receives:** Upload link from Sarah (accountant)

### Flow

```
1. Tom receives email:
   "Sarah invited you to upload files to '2024 Tax Season'"
   [Upload Files]
   ↓
2. Clicks button → lands on:
   foldly.com/sarahtax/2024-taxes/tom

   Sees:
   "Upload files to: 2024 Tax Season"
   "Shared by: Sarah (sarahtax@foldly.com)"
   ↓
3. Upload page:
   [Name]: Tom Richards (pre-filled if available)
   [Email]: tom@example.com (pre-filled from invite)
   [Message]: Optional note

   [Drag files or click to browse]
   ↓
4. Tom drags 3 files:
   - W2-2024.pdf
   - 1099-MISC.pdf
   - Receipts.zip
   ↓
5. Progress bar shows upload
   ↓
6. Success message:
   "✅ 3 files uploaded successfully"
   "Sarah will be notified"

   [Upload More Files]
   [Done]
   ↓
7. Week later, Tom visits same link:
   - Same URL still works
   - Uploads 2 more files
   - All 5 files visible to Tom and Sarah
   - Grouped under tom@example.com
```

**Key Features Used:**
- ✅ Personalized upload pages
- ✅ Pre-filled forms
- ✅ Upload progress
- ✅ Success confirmations
- ✅ Link persistence

---

## Journey 5: Collaborative Workspace (Multi-Party)

**User:** Project Manager coordinating client project
**Goal:** 5 people (internal team + client) need to share files bidirectionally

### Flow

```
1. PM creates folder: "Website Redesign - Acme Corp"
   ↓
2. Adds 5 emails:
   Internal team:
   - dev@company.com
   - design@company.com

   Client team:
   - pm@acmecorp.com
   - marketing@acmecorp.com
   - ceo@acmecorp.com
   ↓
3. Promotes all to Editor role:
   - All 5 receive OTP codes
   - All verify
   - All can upload, delete, reorganize
   ↓
4. Collaborative file sharing:
   - Designer uploads mockups
   - Client uploads brand assets
   - Developer uploads technical specs
   - Everyone can see everything
   - Everyone can organize into subfolders
   ↓
5. Dashboard shows activity:
   📁🔗 Website Redesign - Acme Corp
     ├─ 📁 Design Mockups/ (created by design@company.com)
     ├─ 📁 Brand Assets/ (created by marketing@acmecorp.com)
     └─ 📁 Technical Specs/ (created by dev@company.com)

   [By Email] view:
   📧 design@company.com (12 files)
   📧 marketing@acmecorp.com (8 files)
   📧 dev@company.com (15 files)
```

**Key Features Used:**
- ✅ Multi-user collaboration
- ✅ Editor role for everyone
- ✅ Subfolder creation
- ✅ Bidirectional sharing
- ✅ Email-based tracking

---

## Key Patterns Across All Journeys

### Common Actions:
1. Create folder
2. Generate/toggle shareable link
3. Add email(s)
4. Send invitations or copy link
5. Monitor uploads via email filters
6. Promote roles when needed
7. Search/filter by email

### Critical UX Requirements:
- **Speed:** Folder creation → link generation in < 10 seconds
- **Simplicity:** No login required for uploaders
- **Clarity:** Always show who uploaded what
- **Flexibility:** Switch between folder and email views seamlessly
- **Control:** Easy role management and access changes

---

## Flow Diagrams Needed

Next steps: Create visual diagrams for:
1. ✅ Folder creation + link generation
2. ✅ Email repository creation
3. ✅ External uploader flow
4. ✅ Dashboard filtering/views
5. ⏳ Role promotion flow (detailed)
6. ⏳ Public ↔ Private transition flow
