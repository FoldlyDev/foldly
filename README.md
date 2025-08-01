# Foldly - Advanced File Collection SaaS with Smart Organization

> **Status**: 🚀 Database Foundation Complete (95%) - Database-First Architecture Ready  
> **Next**: 📁 Service Layer Implementation (Database Integration & Type Alignment)

## 🎯 Project Overview

**Foldly** is a modern **full-stack Next.js application** for advanced file collection SaaS that provides multiple link types, and flexible security controls for professional file management workflows.

> **Architecture**: Full-stack Next.js application - frontend and backend integrated in a single codebase

### Core Link Types & Features

#### **Base Upload Links**

- **Format**: `foldly.com/[any-slug]` (users can set ANY slug they want, not tied to username)
- **Purpose**: General "data dump" area for any file uploads
- **Use Case**: Primary collection point for various file types
- **Examples**: `foldly.com/myfiles`, `foldly.com/portfolio`, `foldly.com/uploads2025`

#### **Custom Topic Links**

- **Format**: `foldly.com/[any-slug]/[topic]` (base slug with a topic)
- **Examples**: `foldly.com/portfolio/designs`, `foldly.com/myfiles/documents`
- **Purpose**: Project-specific links with automatic folder organization
- **Creation**: Right-click any folder to generate custom upload link

#### **Generated Links**

- **Format**: `foldly.com/[any-slug]/[generated-slug]` (base slug + generated slug)
- **Examples**: `foldly.com/myfiles/xY7k9m2`, `foldly.com/portfolio/aB3n5K8`
- **Purpose**: Auto-generated links for folder shares
- **Creation**: System generates unique slug when sharing folders

### Dynamic URL System

- **Multi-Environment Support**: Automatic detection for localhost, Vercel preview, and production
- **No Hardcoded Domains**: Centralized configuration handles all URL generation
- **Security**: Host validation prevents header injection attacks
- **Configuration**: Optional `NEXT_PUBLIC_APP_URL` for production domain

### Advanced Upload & Organization System

#### **Uploader Requirements (Minimal Friction)**

- **Mandatory**: Name field only
- **Optional**: Email (if required by recipient), batch/folder naming
- **Organization**: Uploaders can create folders before submitting
- **Batch Naming**: Auto-prompted to name file groups on submission

#### **Smart File Organization**

- **Display Format**: `[Uploader Name] (Batch Name) [Date]`
- **Default**: Uses uploader name if no batch name provided
- **Recipient Control**: Full reorganization capabilities post-upload
- **Organization Workflow**: Recipients can only organize/reorganize files after dragging them into their personal workspace/repo area within the platform
- **Automation**: Custom links auto-sort to designated folders

### Security & Permission Controls (Recipient-Managed)

#### **Access Controls**

- **Email Requirement**: Toggle to require uploader email
- **Password Protection**: Optional password-lock for upload links
- **Visibility Settings**: Public vs private sublink configurations
  - **Public**: `foldly.com/wedding/photos` (viewable by all)
  - **Private**: `foldly.com/private/contractor-bids` (recipient-only access)

#### **Security Features**

- **File Type Warnings**: Alerts for compressed files (malware protection)
- **No Forced Login**: Maintains zero-friction uploads for senders
- **Future Branding**: Custom banner/logo upload page customization

## 🏗️ Modern Tech Stack (2025)

### Full-Stack Application

- **Next.js 15+** (App Router) - handles both frontend and backend + **TypeScript 5+**
- **TailwindCSS 4.0** + **Shadcn/ui** components
- **Zustand** (state) + **React Query** (server state)
- **Framer Motion** (animations)

### Backend & Infrastructure (Integrated with Next.js)

- **Supabase** (PostgreSQL database + file storage + real-time)
- **Clerk + Supabase** (JWT-based authentication with RLS)
- **Next.js App Router** (full-stack framework with tRPC)
- **Supabase Storage** (file storage with global CDN)
- **Vercel** (hosting) + **Stripe** (payments)

## 📚 Documentation

This project follows documentation-first development with comprehensive planning:

- **[📚 Documentation Hub](docs/README.md)** - Organized documentation with clear navigation
- **[🗄️ Database Documentation](docs/database/README.md)** - Complete database schema and operations
- **[🛠️ Implementation Guides](docs/implementation/README.md)** - Consolidated technical implementation guides
- **[💼 Business Documentation](docs/business/README.md)** - Strategy, planning, and market analysis

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and **pnpm** (package manager)
- **Git** for version control
- **Supabase** account (database + storage + real-time)

### Development Environment ✅ Complete

**Completed Setup**:

- ✅ **Dependencies**: Modern 2025 stack (Next.js 15, React 19, TypeScript 5)
- ✅ **Code Quality**: Prettier, Husky pre-commit hooks, lint-staged
- ✅ **UI System**: Shadcn/ui components with manual setup (preserving existing styles)
- ✅ **Database**: Supabase PostgreSQL with Row Level Security and real-time capabilities
- ✅ **Testing**: Vitest + React Testing Library infrastructure
- ✅ **Authentication**: Clerk integration with 2025 middleware, protected routes, webhooks

### Database Foundation ✅ Complete

**Database-First Architecture (95% Complete)**:

- ✅ **Schema Design**: 6-table PostgreSQL schema with multi-link architecture
- ✅ **Type System**: Complete TypeScript types generated from database schema
- ✅ **Drizzle ORM**: Configured with Supabase integration and migrations
- ✅ **Row Level Security**: Implemented with Clerk JWT authentication
- ✅ **File Types Support**: Added `allowedFileTypes` field for MIME type restrictions
- ✅ **MVP Simplification**: Removed tasks table, simplified folders for core functionality

### Next Development Phase

1. **Service Layer Integration**: Fix database service imports and type alignments
2. **Feature Type Alignment**: Update links feature to use database-first types
3. **Database Adapter Functions**: Create UI adapters for seamless type conversion
4. **Multi-Link Implementation**: Complete service layer for base, custom, and generated links

> **Current Focus**: Database-to-feature integration and type alignment (Phase 2 Ready)

## 🔒 Advanced Security & UX Features

### **Zero-Friction Upload Experience**

- **No Mandatory Login**: Uploaders need only provide name
- **Minimal Form Fields**: Optional email/batch naming to maintain low friction
- **Security Warnings**: Smart alerts for potentially risky file types
- **Progress Tracking**: Real-time upload progress and batch completion

### **Professional Organization Tools**

- **Automatic Sorting**: Custom links route to designated folders
- **Batch Management**: Groups files with uploader and date information
- **Drag-and-Drop**: Full reorganization capabilities for recipients (only after dragging files into personal workspace)
- **Workspace Organization**: Recipients must move files to their personal workspace/repo area before organizing
- **Custom Link Generation**: Right-click folder creation for targeted uploads

### **Flexible Permission System**

- **Recipient-Controlled**: All security features are optional toggles
- **Granular Visibility**: Public/private settings per link or folder
- **Password Protection**: Optional security layer for sensitive uploads
- **Email Requirements**: Configurable uploader identification

## 💰 Cost Optimization Strategy

**Monthly Operating Costs (Projected)**:

- **MVP Stage**: ~$45/month (Vercel + Supabase + basic services)
- **Growth Stage**: ~$176/month (scaled services with enterprise security)
- **Target Revenue**: $2,450/month by month 6

**Key Cost Optimizations**:

- Serverless-first architecture (pay-per-use)
- Supabase unified platform (database + storage + real-time)
- Automatic file CDN optimization via Supabase Storage
- Vercel Edge Network (global CDN included)

## 🎯 Development Phases

### Phase 1: Database Foundation ✅ Complete

- ✅ 6-table PostgreSQL schema with multi-link architecture
- ✅ Complete TypeScript type system from database schema
- ✅ Drizzle ORM with Supabase integration and migrations
- ✅ Row Level Security policies with Clerk JWT authentication
- ✅ MVP simplification (removed tasks, simplified folders)

### Phase 2: Service Layer Integration (Current)

- 🔄 Fix database service import paths and type alignments
- 🔄 Update links feature to use database-first types
- 🔄 Create UI adapter functions for seamless type conversion
- 🔄 Complete multi-link service layer implementation

### Phase 3: Core Features (Next)

- 📋 Multi-link upload system (base + custom topic links)
- 📋 Advanced upload requirements (name mandatory, email optional)
- 📋 Batch organization and folder creation
- 📋 Basic permission controls (public/private)

### Phase 4: Professional Features (Future)

- 📋 Password protection for upload links
- 📋 Advanced file organization tools
- 📋 Real-time notifications and progress tracking
- 📋 Analytics dashboard with batch insights

### Phase 5: Enterprise Scale (Future)

- 📋 Custom branding and white-label solutions
- 📋 Advanced security controls and audit logs
- 📋 API for integrations and automation
- 📋 Multi-language support and accessibility

## 📊 Success Metrics

### Technical KPIs

- **Performance**: < 3s load times globally
- **Reliability**: 99.9% uptime target
- **Quality**: 80%+ test coverage
- **Security**: Zero critical vulnerabilities

### Business KPIs (Post-Launch)

- **Growth**: 100 signups in first month
- **Conversion**: 10% free-to-paid rate
- **Retention**: < 2% monthly churn
- **Organization Efficiency**: 90% reduction in manual file sorting

## 🛠️ Development Standards

- **TypeScript Strict Mode**: Maximum type safety
- **Clean Code Principles**: DRY, SOLID, senior-level quality
- **Testing Required**: Unit, integration, and E2E tests for all link types
- **Documentation-First**: All features documented before coding
- **Performance Budget**: Core Web Vitals compliance mandatory
- **Security-First**: All permission controls tested for edge cases

## 📞 Next Actions

1. **Simplified Database Schema**: Multi-link types, permission controls, batch metadata (MVP Ready)
2. **Multi-Link Upload System**: Implement base + custom link handling (Task 12)
3. **Permission Controls**: Email requirements, password protection, visibility toggles (Task 13)
4. **Organization Features**: Pre/post-upload folder management, batch naming (Task 14)
5. **Security Integration**: File type warnings, access controls, audit logging (Task 15)

> **Ready to continue?** Check [TASK.md](docs/development/TASK.md) for Task 10 (Advanced Multi-Link Database Setup) and current sprint goals.

---

**Built with 2025's modern SaaS architecture** • **Multi-link organization system** • **Advanced security controls** • **Documentation-driven development**
