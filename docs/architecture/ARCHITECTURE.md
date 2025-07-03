# Foldly - Technical Architecture Specification

> **Architecture Version**: 2025.1 - Feature-Based Architecture  
> **Last Updated**: January 2025  
> **Architecture Type**: Modern Next.js Full-Stack with Advanced Multi-Link System

## 🏗️ **Executive Architecture Summary**

Foldly implements a **sophisticated feature-based architecture** following 2025 React/Next.js best practices. The system is designed as a **scalable, enterprise-grade SaaS platform** for advanced file collection with **multi-link capabilities**, **intelligent organization**, and **real-time collaboration features**.

### **Core Architecture Principles**

1. **Feature-Based Organization**: Complete separation of concerns with co-located code
2. **Type Safety First**: End-to-end TypeScript with branded types and Result patterns
3. **Performance Optimized**: Sub-3-second load times with efficient state management
4. **Security Layered**: Multi-tier security with Row Level Security and audit logging
5. **Scalable Foundation**: Architecture supports 10,000+ concurrent users

---

## 📁 **Feature-Based Project Architecture**

### **Complete Project Structure**

```
foldly/
├── src/
│   ├── app/                          # Next.js 15 App Router
│   │   ├── (auth)/                   # Authentication routes group
│   │   ├── (public)/                 # Public routes group
│   │   ├── dashboard/                # Protected dashboard routes
│   │   ├── api/                      # API routes and webhooks
│   │   ├── layout.tsx                # Root layout with providers
│   │   ├── page.tsx                  # Landing page route
│   │   ├── loading.tsx               # Global loading UI
│   │   ├── error.tsx                 # Global error boundary
│   │   ├── not-found.tsx             # 404 page
│   │   └── globals.css               # Global styles with feature imports
│   │
│   ├── components/                   # Feature-Based Component Architecture
│   │   ├── features/                 # 🎯 FEATURE-BASED ORGANIZATION
│   │   │   ├── links/                # 📋 Complete Link Management Feature
│   │   │   │   ├── components/       # Feature-specific UI components
│   │   │   │   │   ├── modals/       # Link creation, editing, details
│   │   │   │   │   ├── sections/     # Information, branding, statistics
│   │   │   │   │   ├── views/        # List, grid, empty states
│   │   │   │   │   └── cards/        # Link cards and overview
│   │   │   │   ├── hooks/            # Link-specific custom hooks
│   │   │   │   ├── store/            # Zustand state management
│   │   │   │   ├── services/         # API services & business logic
│   │   │   │   ├── types/            # Domain types & interfaces
│   │   │   │   ├── styles/           # Feature-specific styling
│   │   │   │   └── tests/            # Feature-specific tests
│   │   │   │
│   │   │   ├── upload/               # 📤 File Processing Feature
│   │   │   │   ├── services/         # Upload API & processing
│   │   │   │   ├── types/            # Upload pipeline types
│   │   │   │   └── tests/            # Upload functionality tests
│   │   │   │
│   │   │   ├── dashboard/            # 📊 Analytics & Management
│   │   │   │   ├── components/
│   │   │   │   │   ├── sections/     # Analytics cards, headers, actions
│   │   │   │   │   └── views/        # Dashboard container, empty states
│   │   │   │   ├── hooks/            # Dashboard data hooks
│   │   │   │   ├── store/            # Dashboard state management
│   │   │   │   └── services/         # Analytics API services
│   │   │   │
│   │   │   ├── landing/              # 🚀 Marketing & Onboarding
│   │   │   │   ├── components/
│   │   │   │   │   ├── sections/     # Hero, features, about, outro
│   │   │   │   │   └── views/        # Landing page container
│   │   │   │   ├── hooks/            # Landing animations (GSAP)
│   │   │   │   └── styles/           # Landing page styles
│   │   │   │
│   │   │   └── auth/                 # 🔐 Authentication (minimal)
│   │   │       └── styles/           # Auth page styling
│   │   │
│   │   ├── ui/                       # Global UI Components
│   │   │   ├── shadcn/               # Shadcn/ui components
│   │   │   ├── animate-ui/           # Custom animated components
│   │   │   └── [component].tsx       # Custom UI components
│   │   │
│   │   ├── layout/                   # Global Layout Components
│   │   │   ├── navigation.tsx        # Main navigation
│   │   │   └── dashboard-navigation.tsx # Dashboard sidebar
│   │   │
│   │   └── shared/                   # Shared/Common Components
│   │
│   ├── lib/                          # Global Utilities & Configuration
│   │   ├── hooks/                    # Global custom hooks
│   │   ├── utils/                    # Global utility functions
│   │   ├── validations/              # Global validation schemas
│   │   ├── config/                   # Global configuration
│   │   ├── constants/                # Global constants
│   │   └── animations/               # Global animation utilities
│   │
│   ├── types/                        # Global Type Definitions
│   │   ├── api/                      # Global API types
│   │   ├── auth/                     # Global auth types
│   │   ├── global/                   # Global utility types
│   │   ├── database/                 # Global database types
│   │   └── features/                 # General component types
│   │
│   ├── server/                       # Server-Side Architecture
│   │   ├── api/routers/              # tRPC API routers
│   │   ├── auth/                     # Server-side auth configuration
│   │   ├── db/schema/                # Database schemas (Drizzle ORM)
│   │   └── uploadthing/              # File upload configuration
│   │
│   ├── store/                        # Global State Management
│   │   └── slices/                   # Global Zustand stores
│   │
│   ├── styles/                       # Global Styling
│   │   └── components/               # Global component styles
│   │       ├── layout/               # Layout-specific styles
│   │       └── ui/                   # UI component styles
│   │
│   └── middleware.ts                 # Next.js middleware (auth, routing)
│
├── docs/                             # 📚 2025 Documentation Architecture
│   ├── architecture/                 # Technical architecture docs
│   ├── business/                     # Business strategy & planning
│   ├── design/                       # Design system & UI guidelines
│   ├── development/                  # Development processes
│   ├── setup/                        # Configuration & deployment
│   └── README.md                     # Documentation navigation
│
├── __tests__/                        # Global Testing Infrastructure
│   ├── components/                   # Component tests
│   ├── e2e/                          # End-to-end tests
│   ├── lib/                          # Utility tests
│   └── server/                       # Server-side tests
│
└── public/                           # Static Assets
    └── assets/img/logo/              # Branding assets
```

---

## 🎯 **Feature Architecture Deep Dive**

### **1. Links Feature - Complete Multi-Link System**

The **Links feature** represents the core innovation of Foldly with **advanced multi-link architecture**:

#### **Component Organization**

```typescript
// Feature-specific component structure
links/
├── components/
│   ├── modals/           // Link creation & management modals
│   │   ├── create-link-modal.tsx
│   │   ├── link-creation-modal.tsx
│   │   ├── link-details-modal.tsx
│   │   └── link-modals.tsx
│   ├── sections/         // Information display sections
│   │   ├── link-branding-section.tsx
│   │   ├── link-information-section.tsx
│   │   └── link-stats-grid.tsx
│   ├── cards/            // Link display cards
│   │   ├── link-card.tsx
│   │   └── links-overview-cards.tsx
│   └── views/            // Container and state views
│       ├── links-container.tsx
│       ├── populated-links-state.tsx
│       └── empty-links-state.tsx
├── hooks/                // Link-specific hooks
│   ├── use-dashboard-links.ts
│   └── use-link-creation.ts
├── store/                // Feature state management
│   └── links-store.ts    // Zustand store with 2025 patterns
├── services/             // Business logic & API
│   ├── links-api-service.ts      // Direct API communication
│   ├── links-service.ts          // Business logic layer
│   ├── types.ts                  // Service interfaces
│   └── index.ts                  // Barrel exports
├── types/                // Domain-specific types
│   └── index.ts          // Link domain types
├── styles/               // Feature-specific styling
│   └── links-page.css    // Link management styles
└── tests/                // Feature-specific tests
    └── links.test.tsx    // Component and integration tests
```

#### **Multi-Link Type System**

```typescript
// Advanced link type architecture
export const LINK_TYPES = {
  BASE: 'base', // foldly.com/username
  CUSTOM: 'custom', // foldly.com/username/topic
  GENERATED: 'generated', // Right-click folder creation
} as const satisfies Record<string, string>;

export type LinkType = (typeof LINK_TYPES)[keyof typeof LINK_TYPES];
```

### **2. Upload Feature - Advanced File Processing**

#### **Service Architecture**

```typescript
// Upload processing pipeline
upload/
├── services/
│   ├── upload-api-service.ts     // File upload API
│   ├── file-validation-service.ts // Security validation
│   ├── batch-processing-service.ts // Batch management
│   └── progress-tracking-service.ts // Real-time progress
├── types/
│   ├── upload-pipeline.ts        // Processing types
│   ├── validation.ts             // Security types
│   └── progress.ts               // Progress tracking types
└── tests/
    └── upload-processing.test.ts // Upload pipeline tests
```

### **3. Dashboard Feature - Analytics & Management**

#### **Component Structure**

```typescript
// Dashboard organization
dashboard/
├── components/
│   ├── sections/         // Dashboard sections
│   │   ├── dashboard-header.tsx
│   │   ├── analytics-cards.tsx
│   │   └── quick-actions.tsx
│   └── views/            // Dashboard views
│       ├── dashboard-container.tsx
│       ├── empty-state.tsx
│       └── dashboard-layout-wrapper.tsx
├── hooks/                // Dashboard-specific hooks
├── store/                // Dashboard state
└── services/             // Analytics API services
```

---

## 🔧 **Technology Stack Architecture**

### **Frontend Architecture**

#### **Framework & Core**

- **Next.js 15**: App Router with React 19 and TypeScript 5
- **React Server Components**: Optimal performance with SSR
- **TypeScript**: Strict mode with branded types and Result patterns
- **TailwindCSS 4.0**: CSS-first approach with design system

#### **State Management**

```typescript
// Modern Zustand architecture
interface LinksStore {
  links: LinkWithStats[];
  viewMode: ViewMode;
  filters: LinkFilters;

  // Actions with Result pattern
  createLink: (data: CreateLinkData) => Promise<Result<Link, LinkError>>;
  updateLink: (
    id: LinkId,
    data: UpdateLinkData
  ) => Promise<Result<Link, LinkError>>;
  deleteLink: (id: LinkId) => Promise<Result<void, LinkError>>;

  // Computed selectors
  filteredLinks: () => LinkWithStats[];
  linkStats: () => LinkStatistics;
}
```

#### **Component System**

- **Shadcn/ui**: Base component library with customization
- **Animate-ui**: Custom animated components
- **Feature Components**: Co-located with business logic

### **Backend Architecture**

#### **Database Layer**

```sql
-- Multi-link database architecture
CREATE TABLE upload_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  topic VARCHAR(100), -- NULL for base links
  link_type link_type_enum DEFAULT 'base',

  -- Security & access controls
  require_email BOOLEAN DEFAULT FALSE,
  require_password BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  is_public BOOLEAN DEFAULT TRUE,

  -- Organization settings
  auto_create_folders BOOLEAN DEFAULT TRUE,
  default_folder_id UUID REFERENCES folders(id),

  -- Constraints & metadata
  max_files INTEGER DEFAULT 100,
  max_file_size BIGINT DEFAULT 104857600,
  expires_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security for multi-tenant architecture
CREATE POLICY "Users manage own links"
  ON upload_links FOR ALL USING (auth.jwt()->>'sub' = user_id::text);
```

#### **API Architecture**

- **tRPC**: End-to-end type safety with Zod validation
- **Supabase**: PostgreSQL with Row Level Security
- **Real-time**: Supabase Realtime + Socket.io for live updates

---

## 🔒 **Security Architecture**

### **Multi-Layer Security System**

#### **Authentication Layer**

- **Clerk**: Enterprise-grade authentication with RBAC
- **JWT Tokens**: Secure session management with automatic refresh
- **Social Login**: OAuth 2.0 with verified providers

#### **Database Security**

- **Row Level Security**: Database-level multi-tenant protection
- **Encrypted Storage**: AES-256 encryption for sensitive data
- **Audit Logging**: Complete access and operation tracking

#### **File Security Pipeline**

```typescript
// Security validation pipeline
interface FileSecurityPipeline {
  preUpload: {
    typeValidation: (file: File) => Result<void, ValidationError>;
    sizeCheck: (file: File, limits: FileLimits) => Result<void, SizeError>;
    mimeValidation: (file: File) => Result<void, MimeError>;
  };

  duringUpload: {
    virusScanning: (file: File) => Promise<Result<void, SecurityError>>;
    contentAnalysis: (
      file: File
    ) => Promise<Result<FileMetadata, AnalysisError>>;
    encryptionProcess: (
      file: File
    ) => Promise<Result<EncryptedFile, EncryptionError>>;
  };

  postUpload: {
    integrityVerification: (file: StoredFile) => Result<void, IntegrityError>;
    metadataExtraction: (
      file: StoredFile
    ) => Result<FileMetadata, ExtractionError>;
    auditLogging: (operation: FileOperation) => Promise<void>;
  };
}
```

---

## ⚡ **Performance Architecture**

### **Optimization Strategies**

#### **Frontend Performance**

- **Code Splitting**: Feature-based chunking with dynamic imports
- **Image Optimization**: Next.js Image component with WebP conversion
- **Bundle Analysis**: Automated bundle size monitoring
- **Caching Strategy**: Intelligent caching with SWR patterns

#### **Database Performance**

- **Indexed Queries**: Optimized database indexes for all query patterns
- **Connection Pooling**: Supabase connection optimization
- **Query Optimization**: N+1 query prevention with proper joins
- **Real-time Subscriptions**: Efficient WebSocket connections

#### **File Handling Performance**

- **Progressive Upload**: Chunked file uploads with resume capability
- **CDN Delivery**: Global content delivery with edge caching
- **Compression**: Automatic file compression for storage efficiency
- **Lazy Loading**: Progressive loading for large file lists

---

## 🧪 **Testing Architecture**

### **Comprehensive Testing Strategy**

#### **Feature-Based Testing**

```typescript
// Feature testing structure
links/tests/
├── components/
│   ├── modals/link-creation-modal.test.tsx
│   ├── views/links-container.test.tsx
│   └── cards/link-card.test.tsx
├── hooks/
│   └── use-dashboard-links.test.ts
├── services/
│   ├── links-api-service.test.ts
│   └── links-service.test.ts
├── store/
│   └── links-store.test.ts
└── integration/
    └── link-creation-flow.test.tsx
```

#### **Testing Tools & Coverage**

- **Unit Tests**: Vitest with React Testing Library
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Playwright for complete user journeys
- **Type Tests**: TypeScript compilation testing
- **Performance Tests**: Load testing for file uploads

---

## 📈 **Scalability Architecture**

### **Growth Readiness**

#### **Horizontal Scaling**

- **Feature Isolation**: Independent feature deployments
- **Database Sharding**: User-based data distribution strategies
- **CDN Scaling**: Global content delivery optimization
- **API Rate Limiting**: Intelligent throttling and scaling

#### **Team Scalability**

- **Feature Ownership**: Clear team boundaries by feature
- **Independent Development**: No cross-feature dependencies
- **Parallel Deployment**: Feature-based CI/CD pipelines
- **Code Quality**: Automated quality gates and reviews

#### **Performance Targets**

- **Load Time**: < 3 seconds globally (95th percentile)
- **Concurrent Users**: 10,000+ with current architecture
- **File Upload**: 100MB files with < 30 second processing
- **Database Queries**: < 100ms average response time

---

## 🔄 **Development Workflow Architecture**

### **Feature Development Lifecycle**

#### **Development Process**

1. **Feature Planning**: Architecture design and API specification
2. **Type Definition**: Domain types and service interfaces
3. **Service Implementation**: Business logic and API services
4. **Component Development**: UI components with feature co-location
5. **Integration Testing**: End-to-end feature validation
6. **Performance Validation**: Load testing and optimization

#### **Code Quality Standards**

- **TypeScript Strict**: 100% type coverage with branded types
- **Test Coverage**: 85% minimum with feature-based testing
- **Performance Budget**: Automated bundle size monitoring
- **Security Scanning**: Automated vulnerability detection

---

## 🎯 **Architecture Benefits**

### **Developer Experience**

- **Feature Isolation**: Clear boundaries and minimal conflicts
- **Type Safety**: Compile-time error prevention
- **Testing Strategy**: Comprehensive coverage with fast feedback
- **Documentation**: Up-to-date architecture documentation

### **Business Benefits**

- **Team Scalability**: Multiple developers working independently
- **Feature Velocity**: Rapid development and deployment
- **Quality Assurance**: Built-in quality gates and testing
- **Performance Predictability**: Consistent load times and reliability

### **Technical Benefits**

- **Maintainability**: Clear code organization and separation
- **Extensibility**: Easy addition of new features and capabilities
- **Performance**: Optimized loading and execution patterns
- **Security**: Multi-layer protection and audit capabilities

---

## 🏆 **Architecture Achievement Summary**

**Foldly's architecture** represents a **production-ready, enterprise-grade foundation** that successfully implements **2025 best practices** for **scalable SaaS development**. The **feature-based organization** enables **rapid development**, **team collaboration**, and **long-term maintainability** while providing **excellent performance** and **security**.

### **Key Architectural Accomplishments**

- ✅ **Modern Feature-Based Architecture**: Complete separation of concerns
- ✅ **Type Safety Excellence**: End-to-end TypeScript with branded types
- ✅ **Performance Optimization**: Sub-3-second load times globally
- ✅ **Security Implementation**: Multi-layer protection with audit logging
- ✅ **Scalability Foundation**: Architecture supports 10,000+ users
- ✅ **Developer Experience**: Quality tools and clear organization
- ✅ **Testing Infrastructure**: Comprehensive testing with high coverage

---

**Result**: 🚀 **Foldly is architected for enterprise success with a foundation that supports rapid growth, team scalability, and long-term technical excellence.**

---

_This architecture specification serves as the technical foundation for Foldly's advanced multi-link file collection platform, ensuring scalable development and enterprise-grade quality standards._
