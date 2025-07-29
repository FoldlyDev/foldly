# 🚀 Foldly Complete Setup Guide

> **Comprehensive setup guide for all services, authentication, and infrastructure**  
> **Updated**: January 2025 | **Architecture**: Next.js 15 + Supabase + Clerk

## 📋 **Setup Overview**

This guide consolidates all setup instructions for Foldly development and production deployment. Follow the sections in order for optimal results.

### **Quick Setup Timeline**

- **Phase 1** (Week 1): Core Development Setup - Vercel, Supabase, Clerk
- **Phase 2** (Week 2): Payment & Communication - Stripe, Resend
- **Phase 3** (Week 3): Production Optimization - Cloudflare, Sentry

---

## 🎯 **Phase 1: Core Development Setup**

### **1. Vercel - Hosting & Deployment**

**Purpose**: Host Next.js application with automatic deployments

#### **Setup Steps**

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub account for integration
3. **Plan**: Free tier → Pro ($20/month) for production
4. Connect GitHub repository for automatic deployments

#### **Configuration**

- **Domain**: Purchase through Vercel ($15-20/year) or use custom domain
- **Environment Variables**: Configure in Vercel dashboard
- **Build Settings**: Next.js (auto-detected)

#### **Cost**: $0 (dev) → $20/month (production)

---

### **2. Supabase - Database & Storage Platform**

**Purpose**: PostgreSQL database with integrated file storage and real-time capabilities

#### **Setup Steps**

1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub account
3. Create project named "foldly-prod"
4. **Plan**: Free tier → Pro ($25/month) when needed

#### **Database Configuration**

**Step 2.1: Run Database Migrations**

```bash
# Apply database schema
npm run migrate
```

**Step 2.2: Setup Dual Storage Buckets**

Execute in Supabase SQL Editor:

```sql
-- Create workspace-files bucket (private workspace files)
INSERT INTO storage.buckets (id, name, public) VALUES ('workspace-files', 'workspace-files', false);

-- Create shared-files bucket (files shared via links)
INSERT INTO storage.buckets (id, name, public) VALUES ('shared-files', 'shared-files', false);

-- Set up RLS policies for workspace files
CREATE POLICY "Users can upload to own workspace folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'workspace-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Set up RLS policies for shared files
CREATE POLICY "Users can view shared files via links" ON storage.objects
FOR SELECT USING (
  bucket_id = 'shared-files'
  AND EXISTS (
    SELECT 1 FROM links l
    WHERE l.id = (storage.foldername(name))[1]::uuid
    AND (l.is_public = true OR l.user_id = auth.uid())
  )
);
```

#### **Environment Variables**

Add to `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"

# ⚠️ CRITICAL: Use both pooled and non-pooled URLs for optimal Drizzle performance
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
POSTGRES_URL="postgresql://postgres:[password]@db.[project].supabase.co:6543/postgres"
POSTGRES_URL_NON_POOLING="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
```

#### **Database Configuration Notes**

- **Non-Pooling URL**: Required for Drizzle Kit operations (`npm run push`, `npm run pull`)
- **SSL Handling**: Automatic environment-aware SSL configuration implemented
- **If you encounter connection/SSL timeouts**: See [Database Configuration Guide](../database/DATABASE_CONFIGURATION.md)

#### **Storage Architecture**

- **Workspace Files**: `workspace-files/{userId}/workspace/{timestamp}_{filename}`
- **Shared Files**: `shared-files/{linkId}/{timestamp}_{filename}`
- **Security**: RLS policies ensure users only access their own files
- **Limits**: 50MB per file, variable storage by subscription tier

#### **Cost**: $0 (500MB DB, 1GB storage) → $25/month (8GB DB, 100GB storage)

---

### **3. Clerk - Authentication & Billing Service (2025 Integration)**

**Purpose**: User authentication, sign-up/sign-in, user management with integrated billing and subscription management

#### **Setup Steps**

1. Go to [clerk.com](https://clerk.com)
2. Create application named "Foldly"
3. **Plan**: Free tier (10K MAU) → Pro ($25/month) for scaling
4. Configure authentication methods:
   - ✅ Email
   - ✅ Google (recommended)
   - ✅ GitHub (optional)

#### **Configuration**

**Step 3.1: Get API Keys**
From Clerk Dashboard → API Keys:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_`)
- `CLERK_SECRET_KEY` (starts with `sk_test_`)

**Step 3.2: Configure Webhooks**

1. Clerk Dashboard → Webhooks → Add Endpoint
2. URL: `https://your-domain.com/api/webhooks/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted`
4. Copy Signing Secret

#### **Environment Variables**

Add to `.env.local`:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
CLERK_SECRET_KEY="sk_test_your_secret_key_here"
CLERK_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Clerk Routes (Optional - uses defaults)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/dashboard"
```

#### **Customization**

```typescript
// Authentication pages use Foldly brand colors
<SignIn
  appearance={{
    elements: {
      formButtonPrimary: 'bg-[#6c47ff] hover:bg-[#5a3dd9]',
      card: 'shadow-xl',
    },
  }}
/>
```

#### **Testing Authentication**

1. Start dev server: `npm run dev`
2. Navigate to `/sign-in`
3. Complete sign-up process
4. Verify redirect to `/dashboard`
5. Test protected route access

#### **Cost**: $0 (up to 10K users) → $25/month (unlimited users)

---

## 💰 **Phase 2: Payment & Communication Setup**

### **4. Clerk Billing (2025) - Integrated Payment Processing**

**Purpose**: Complete billing solution integrated directly with Clerk authentication for seamless subscription management

#### **2025 Clerk Billing Integration**

Foldly leverages **Clerk's 2025 billing system** - a production-ready SaaS billing solution that provides:

- **Direct Stripe Integration**: Automatic Stripe Connect setup through Clerk
- **Real-time Feature Access**: `user.has({ plan: 'plan_name' })` and `user.has({ feature: 'feature_name' })`
- **Webhook Automation**: Automatic subscription state synchronization
- **Revenue Optimization**: Built-in analytics and conversion tracking

#### **Setup Steps**

1. **Enable Billing in Clerk**: Go to Clerk Dashboard → Billing (2025)
2. **Connect Stripe**: Follow guided Stripe Connect setup (auto-configured)
3. **Configure Plans**: Set up subscription tiers directly in Clerk interface
4. **Test Integration**: Use Clerk's billing test mode for development

#### **Clerk Billing Advantages**

- **Zero Integration**: No custom Stripe code required
- **Built-in UI**: Pre-built `<PricingTable />` components
- **Feature-Based Access**: Automatic feature gating
- **Real-time Updates**: Instant subscription changes
- **-60% Code Complexity**: vs direct Stripe integration

#### **Modern Integration Code**

```typescript
// 2025 Clerk Billing Integration
import { billing } from '@/lib/services/billing';

// Simple plan checking
const currentPlan = await billing.getCurrentPlan(); // 'free' | 'pro' | 'business'

// Feature access control
const hasCustomBranding = await billing.hasFeature('custom_branding');
const hasPasswordProtection = await billing.hasFeature('password_protection');

// Complete billing data
const billingData = await billing.billingData.getOverviewData();
```

#### **Component Integration**

```typescript
// Feature gating with automatic upgrade prompts
import { FeatureGate } from '@/features/billing';

export function CustomBrandingSection() {
  return (
    <FeatureGate
      feature="custom_branding"
      upgradeAction={true}
      fallback={<UpgradePrompt feature="custom_branding" />}
    >
      <CustomBrandingSettings />
    </FeatureGate>
  );
}
```

#### **Cost**: 2.9% + 30¢ (Stripe) + 0.7% (Clerk) = ~3.6% + 30¢ per transaction

---

### **5. Resend - Email Service**

**Purpose**: Transactional emails (notifications, confirmations, etc.)

#### **Setup Steps**

1. Go to [resend.com](https://resend.com)
2. Sign up and verify account
3. **Plan**: Free tier (3K emails/month) → Pro ($20/month, 50K emails)
4. Domain verification (developer assistance required)

#### **Environment Variables**

```bash
# Resend Email Service
RESEND_API_KEY="re_your_api_key_here"
```

#### **Cost**: $0 (3K emails) → $20/month (50K emails)

---

## 🔧 **Phase 3: Production Optimization**

### **6. Cloudflare - DNS & Security (Optional)**

**Purpose**: DNS management, DDoS protection, performance optimization

#### **Setup Steps**

1. Go to [cloudflare.com](https://cloudflare.com)
2. Add domain to Cloudflare
3. **Plan**: Free tier → Pro ($20/month) for production
4. Update nameservers with domain registrar

#### **Cost**: $0 (basic) → $20/month (advanced security)

---

### **7. Sentry - Error Monitoring**

**Purpose**: Track and monitor application errors in production

#### **Setup Steps**

1. Go to [sentry.io](https://sentry.io)
2. Sign up with GitHub account
3. Create project "Foldly"
4. **Plan**: Free tier → Team ($26/month) when needed

#### **Environment Variables**

```bash
# Sentry Error Monitoring
SENTRY_DSN="https://your-dsn@sentry.io/project-id"
```

#### **Cost**: $0 (5K errors) → $26/month (50K errors)

---

## 💰 **Total Cost Summary**

### **Development Phase (Months 1-2)**

```
All services on free tiers: $0/month
Perfect for development and testing
```

### **Production Phase (Months 3+)**

```
Vercel Pro:        $20/month
Supabase Pro:      $25/month
Clerk Pro:         $25/month
Stripe + Clerk:    3.6% + 30¢/transaction
Resend Pro:        $20/month
Cloudflare Pro:    $20/month (optional)
Sentry Team:       $26/month (optional)
------------------------
Base Cost:         $136/month + transaction fees
With Optionals:    $182/month + transaction fees
```

### **Break-even Analysis**

- **Target Revenue**: $2,450/month (by month 6)
- **Operating Costs**: $182/month
- **Gross Margin**: 92%+ (excellent for SaaS)

---

## ✅ **Setup Verification Checklist**

### **Phase 1 - Core Development**

- [ ] Vercel account created and GitHub connected
- [ ] Supabase project created with dual storage buckets
- [ ] Database migrations applied successfully
- [ ] Clerk application configured with social auth
- [ ] All API keys added to `.env.local`
- [ ] Authentication flow tested (sign-up → dashboard)
- [ ] File upload tested in workspace

### **Phase 2 - Payment & Communication**

- [ ] Stripe account verified and connected to Clerk
- [ ] Subscription products configured in Clerk Billing
- [ ] Resend account created and domain verified
- [ ] Test email sending working
- [ ] Feature-based access control tested

### **Phase 3 - Production Optimization**

- [ ] Cloudflare DNS configured (if using)
- [ ] Sentry error monitoring setup
- [ ] Production environment variables configured
- [ ] All production plans activated
- [ ] Security review completed

---

## 🔐 **Security & Access Management**

### **API Key Security**

- **Use secure password manager** (1Password, Bitwarden)
- **Enable 2FA** on all service accounts
- **Regular key rotation** (quarterly recommended)
- **Never commit keys to repository**

### **Environment Configuration**

```bash
# Complete .env.local template
# Copy this template and fill in your actual values

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
CLERK_SECRET_KEY="sk_test_your_secret_key_here"
CLERK_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Clerk Routes (Optional - uses defaults)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/dashboard"

# Email Service
RESEND_API_KEY="re_your_api_key_here"

# Error Monitoring (Optional)
SENTRY_DSN="https://your-dsn@sentry.io/project-id"

# Development
NODE_ENV="development"
```

---

## 🚀 **Development Workflow**

### **Starting Development**

```bash
# Clone repository
git clone https://github.com/your-org/foldly.git
cd foldly

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your actual API keys

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### **Testing Complete Setup**

1. **Authentication**: Sign up → Dashboard access
2. **Database**: Create workspace → Verify in Supabase
3. **Storage**: Upload file → Check both buckets
4. **Billing**: Test subscription flow (if configured)
5. **Email**: Trigger notification → Verify delivery

---

## 🔧 **Troubleshooting Common Issues**

### **Authentication Issues**

- **"Invalid publishable key"**: Check key format and `.env.local`
- **"Infinite redirect loop"**: Verify middleware configuration
- **"Webhook verification failed"**: Ensure webhook secret matches

### **Database Issues**

- **Migration fails**: Check connection string and permissions
- **RLS policy errors**: Verify user authentication context
- **Foreign key violations**: Ensure proper user/workspace creation
- **SSL/Connection timeouts**: See [Database Configuration Guide](../database/DATABASE_CONFIGURATION.md#ssl-configuration-critical-fix)
- **Drizzle Kit errors**: Refer to comprehensive [Database Configuration troubleshooting](../database/DATABASE_CONFIGURATION.md#troubleshooting-common-issues)

### **Storage Issues**

- **"Bucket not found"**: Run storage setup SQL script
- **"Permission denied"**: Check RLS policies and user context
- **Upload fails**: Verify file size and MIME type limits

### **Development Issues**

- **Build fails**: Clear `.next` folder and rebuild
- **Type errors**: Run `npm run type-check`
- **Dependency conflicts**: Delete `node_modules` and reinstall

---

## 📞 **Next Steps**

### **Immediate Actions (Week 1)**

1. **Setup core services**: Vercel, Supabase, Clerk
2. **Configure environment**: All API keys in `.env.local`
3. **Test integration**: Complete authentication + database flow
4. **Begin development**: Start building features

### **Pre-launch Actions (Week 2-3)**

1. **Payment setup**: Stripe + Clerk Billing configuration
2. **Email integration**: Resend setup and testing
3. **Production prep**: Environment variable configuration
4. **Security review**: All access controls verified

### **Production Deployment (Week 4+)**

1. **Production services**: Upgrade to paid plans
2. **Monitoring setup**: Sentry + Cloudflare (optional)
3. **Final testing**: End-to-end production testing
4. **Go live**: Production deployment with monitoring

---

**Estimated total setup time**: 4-6 hours across 2-3 weeks  
**Development ready**: After Phase 1 completion (~2 hours)  
**Production ready**: After all phases completion (~6 hours)

**Questions?** Contact the development team for assistance with any setup steps or technical configuration.

---

_This consolidated setup guide replaces all individual setup documents and provides a single source of truth for Foldly infrastructure setup._
