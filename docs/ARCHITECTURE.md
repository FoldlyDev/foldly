# Foldly - Technical Architecture Specification

## 🏗️ System Architecture Overview

**Foldly** is built as a modern, serverless **full-stack Next.js application** optimized for cost efficiency and scalability using 2025's best practices.

> **Architecture Type**: **Full-stack Next.js application** - frontend and backend are integrated in a single codebase and deployment

## 🎯 **Architecture Decision: Modular Monolith vs Microservices**

### **Why We Chose a Next.js Full-Stack Application**

**Our approach is a "Modular Monolith" - not a traditional monolith.** This decision is based on industry best practices for SaaS startups in 2025 and follows the successful patterns used by companies like Vercel, Linear, and Notion.

#### **Modular Monolith Characteristics:**

```typescript
// Clean separation of concerns within single codebase
src/
├── app/              # Next.js App Router (routing + pages)
├── components/       # UI components (presentation layer)
├── lib/             # Shared utilities and configurations
├── server/          # Business logic and API layer
│   ├── auth/        # Authentication domain
│   ├── files/       # File management domain
│   ├── billing/     # Payment processing domain
│   └── uploads/     # Upload link management domain
└── types/           # Shared TypeScript definitions
```

#### **External Service Integration (Not Building Everything)**

- **Authentication**: Clerk (specialized auth service)
- **Database**: Neon PostgreSQL (managed database)
- **File Storage**: AWS S3 + CloudFront (cloud storage)
- **Payments**: Stripe (payment processing)
- **Email**: Resend (transactional email service)
- **Monitoring**: Sentry (error tracking)

### **Industry Validation: The Return to Intelligent Monoliths**

As noted in recent industry analysis, _"NextJS represents a compelling evolution of the monolithic paradigm, adapting it to meet the needs of today's developers and users"_ ([source](https://medium.com/@jonbasanti/nextjs-the-monolith-we-now-love-45b9b1266acf)). Modern full-stack frameworks like Next.js address the historical limitations of monoliths while preserving their benefits.

#### **Why This Approach is Professional in 2025:**

**1. Martin Fowler's "Monolith First" Principle**

- Start with a well-structured monolith
- Extract services only when complexity justifies it
- Avoid premature optimization of architecture

**2. Successful Company Examples**

- **Netflix**: Started as monolith, migrated to microservices only after massive scale
- **Atlassian**: Migrated from monolith to 1300+ microservices over years, not immediately
- **Linear**: Remains largely monolithic despite being a successful B2B SaaS
- **Vercel**: Uses Next.js for their own platform

**3. Cost and Operational Efficiency**

- Single deployment pipeline
- Reduced operational complexity
- Lower infrastructure costs
- Faster development cycles

### **When Microservices Make Sense (Not Applicable to Foldly Yet)**

Based on Atlassian's migration experience, microservices are beneficial when:

❌ **Large Teams**: 50+ developers working on the same codebase
❌ **Different Scaling Requirements**: Some services need 10x more resources than others
❌ **Organizational Boundaries**: Multiple teams owning different business domains
❌ **Technology Diversity**: Need for different languages/frameworks per service
❌ **Complex Domain**: Multiple distinct business areas (e-commerce: inventory + shipping + payments + recommendations)

✅ **Foldly's Current Reality**:

- **Small team**: 1-2 developers
- **Focused domain**: File collection and organization
- **Uniform scaling**: All features scale together
- **Single team**: No organizational boundaries to maintain
- **Simple domain**: Upload → organize → share workflow

### **Evolution Path: How We Can Scale**

Our architecture supports natural evolution without requiring a complete rewrite:

#### **Phase 1: Modular Monolith** (Current)

```
Next.js Application
├── Frontend (React components)
├── API Layer (tRPC + Next.js API routes)
├── Business Logic (TypeScript modules)
└── External Services (Clerk, Neon, S3, Stripe)
```

#### **Phase 2: Service Extraction** (If needed at scale)

```
Next.js BFF (Backend-for-Frontend)
├── Frontend (React components)
├── API Gateway (tRPC orchestration)
└── External Services
    ├── Auth Service (Clerk)
    ├── File Processing Service (extracted)
    ├── Notification Service (extracted)
    └── Core Database (Neon)
```

#### **Phase 3: Microservices** (Only if necessary)

```
Multiple Services with API Gateway
├── Next.js Frontend + BFF
├── User Management Service
├── File Processing Service
├── Billing Service
└── Notification Service
```

### **Performance and Scalability Considerations**

#### **Horizontal Scaling with Vercel**

- **Edge Functions**: Automatic global distribution
- **Serverless Architecture**: Pay-per-request scaling
- **CDN Integration**: Static assets served globally
- **Database Scaling**: Neon's serverless PostgreSQL auto-scales

#### **Vertical Scaling Capabilities**

- **Code Splitting**: Next.js automatic bundle optimization
- **Database Optimization**: Connection pooling, query optimization
- **Caching Strategy**: Multiple layers (CDN, API, database)
- **Performance Monitoring**: Real-time metrics and alerting

### **Risk Mitigation**

#### **Avoiding Monolith Pitfalls**

- **Modular Code Organization**: Clear domain boundaries
- **Type Safety**: End-to-end TypeScript prevents integration issues
- **Automated Testing**: Unit, integration, and E2E test coverage
- **Code Quality Gates**: ESLint, Prettier, pre-commit hooks
- **Regular Refactoring**: Continuous code quality improvement

#### **Migration Safety Net**

- **tRPC API Design**: Clean API boundaries make extraction easier
- **Domain-Driven Structure**: Business logic organized by domain
- **External Services**: Already using microservices for specialized functions
- **Monitoring**: Comprehensive observability for performance insights

### **Conclusion: Right-Sized Architecture**

Our Next.js full-stack approach represents **right-sized architecture** for Foldly:

✅ **Optimized for current team size and business stage**
✅ **Follows industry best practices and successful patterns**
✅ **Provides clear evolution path as we scale**
✅ **Maximizes development velocity and cost efficiency**
✅ **Maintains professional code quality and operational standards**

This approach aligns with the modern understanding that _"microservices are a solution to organizational complexity, not technical complexity."_ For Foldly's focused domain and team structure, our modular monolith approach is not just appropriate—it's optimal.

### Architecture Principles

- **Serverless-first**: Minimize operational overhead and costs
- **Type-safe**: End-to-end TypeScript for reduced runtime errors
- **Performance-focused**: Sub-3-second load times globally
- **Security-by-design**: Zero-trust security model
- **Cost-optimized**: Pay-per-use model with automatic scaling

## 🔧 Technical Stack

### Full-Stack Application Components

#### Frontend (React/Next.js)

- **Framework**: Next.js 15+ (App Router) - handles both frontend and backend
- **Language**: TypeScript 5+
- **Styling**: TailwindCSS 4.0 + Shadcn/ui
- **State**: Zustand + React Query
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion

#### Backend (Next.js API Routes + tRPC)

- **API**: tRPC (type-safe) + Next.js API Routes
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Drizzle (lightweight, type-safe)
- **Auth**: Clerk (modern, cost-effective)
- **Storage**: AWS S3 + CloudFront CDN
- **Email**: Resend (developer-friendly)

### Infrastructure

- **Hosting**: Vercel (Next.js optimized)
- **Database**: Neon PostgreSQL (serverless)
- **Monitoring**: Sentry + Vercel Analytics
- **Payments**: Stripe (industry standard)

## 🗄️ Database Schema

```sql
-- Core user management
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  storage_used BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Upload links (core feature)
CREATE TABLE upload_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  max_files INTEGER DEFAULT 100,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- File uploads
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_link_id UUID REFERENCES upload_links(id) ON DELETE CASCADE,
  original_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  uploader_name VARCHAR(255),
  uploader_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔌 API Design

### tRPC Router Structure

```typescript
export const appRouter = createTRPCRouter({
  auth: authRouter,
  upload: uploadRouter,
  files: filesRouter,
  billing: billingRouter,
});

// Example router
export const uploadRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create upload link
    }),

  get: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get upload link details
    }),
});
```

## 🔒 Security Architecture

### Authentication & Authorization

- **Clerk Integration**: Social login, passwordless, MFA
- **Protected Routes**: Server-side auth validation
- **API Security**: tRPC context-based auth
- **File Security**: Presigned URLs, virus scanning

### Data Protection

- **Encryption at Rest**: AES-256
- **Encryption in Transit**: TLS 1.3
- **Input Validation**: Zod schemas everywhere
- **Rate Limiting**: Built-in DoS protection

## 📁 File Storage Strategy

### AWS S3 Configuration

```typescript
const storageConfig = {
  bucket: "foldly-uploads-prod",
  structure: "users/{userId}/links/{linkId}/{fileId}",
  encryption: "AES256",
  versioning: "enabled",
  lifecycle: {
    "transition-to-ia": "30 days",
    "delete-after": "2 years",
  },
};
```

### File Processing Pipeline

1. **Upload** → UploadThing handles secure upload
2. **Scan** → Virus/malware detection
3. **Process** → Metadata extraction, thumbnails
4. **Store** → S3 with CloudFront CDN
5. **Notify** → Email notifications via Resend

## 🚀 Deployment Architecture

### Vercel Configuration

```json
{
  "version": 2,
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "DATABASE_URL": "@database_url",
    "CLERK_SECRET_KEY": "@clerk_secret_key"
  }
}
```

### Environment Management

- **Development**: Local Next.js + Neon branch
- **Staging**: Vercel preview deployments
- **Production**: Vercel production with monitoring

## 📊 Performance Optimization

### Caching Strategy

- **Static Assets**: Vercel Edge Network
- **API Responses**: React Query with SWR
- **Database**: Connection pooling
- **Files**: CloudFront global CDN

### Performance Targets

- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **API Response**: < 500ms average
- **File Upload**: < 30s for 100MB files
- **Uptime**: 99.9% availability

## 🔄 Scalability & Cost Management

### Auto-scaling Strategy

```
Vercel Edge Functions (Auto-scaling)
    ↓
Neon PostgreSQL (Serverless scaling)
    ↓
AWS S3 + CloudFront (Unlimited)
```

### Cost Optimization

- **Database**: Neon's pay-per-use model
- **Compute**: Serverless functions
- **Storage**: S3 Intelligent Tiering
- **CDN**: CloudFront for global delivery

## 🧪 Testing Strategy

### Testing Pyramid

- **Unit Tests (70%)**: Vitest for components/utils
- **Integration Tests (20%)**: API endpoints, DB operations
- **E2E Tests (10%)**: Playwright for critical flows

### Quality Gates

- Code coverage > 80%
- TypeScript strict mode
- Zero ESLint errors
- All E2E tests passing

## 📈 Monitoring & Analytics

### Monitoring Stack

- **Errors**: Sentry for error tracking
- **Performance**: Vercel Analytics
- **Uptime**: Betterstack monitoring
- **User Analytics**: PostHog (privacy-focused)

### Key Metrics

```typescript
const kpis = {
  business: {
    signups: "New user registrations",
    conversions: "Free to paid upgrades",
    churn: "Monthly churn rate",
  },
  technical: {
    uptime: "99.9% target",
    errorRate: "< 0.1%",
    responseTime: "< 500ms average",
  },
};
```

## 🔄 Migration & Deployment

### Database Migrations

```typescript
// Drizzle migration
export async function up(db: Database) {
  await db.execute(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      clerk_id VARCHAR(255) UNIQUE NOT NULL
    );
  `);
}
```

### CI/CD Pipeline

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm test && pnpm test:e2e
  deploy:
    needs: test
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
```

---

_This architecture specification serves as the technical blueprint for Foldly's modern, cost-optimized SaaS platform._
