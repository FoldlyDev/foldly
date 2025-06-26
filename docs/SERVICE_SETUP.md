# Foldly - Service Setup Guide for Employer

> **Purpose**: This guide provides step-by-step instructions for setting up all required service accounts and purchasing necessary plans to begin Foldly development.

## 🎯 **Setup Priority & Timeline**

### **Phase 1: Immediate Setup (Week 1)**

Essential services needed to start development:

1. **Vercel** (Hosting & Deployment)
2. **Neon** (PostgreSQL Database)
3. **Clerk** (Authentication)
4. **GitHub** (Code Repository - if not already available)

### **Phase 2: Pre-Launch Setup (Week 2-3)**

Services needed before going live: 5. **AWS** (File Storage) 6. **Stripe** (Payment Processing) 7. **Resend** (Email Service)

### **Phase 3: Production Setup (Week 4-6)**

Services for production optimization: 8. **Cloudflare** (DNS & Security) 9. **Sentry** (Error Monitoring)

---

## 📋 **Service Setup Instructions**

### **1. Vercel - Hosting & Deployment**

**Purpose**: Host the Next.js application with automatic deployments

#### **Setup Steps:**

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" and use GitHub account for integration
3. **Plan**: Start with **Free tier**, upgrade to **Pro ($20/month)** before production launch
4. **Domain**: Can purchase domain directly through Vercel ($15-20/year)

#### **What Developer Needs:**

- Vercel account email
- Access to deploy from GitHub repository
- Domain name (if purchased through Vercel)

#### **Monthly Cost:**

- **Development**: $0 (Free tier)
- **Production**: $20/month (Pro plan)

---

### **2. Neon - PostgreSQL Database**

**Purpose**: Serverless PostgreSQL database with auto-scaling

#### **Setup Steps:**

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub account
3. **Plan**: Start with **Free tier**, upgrade to **Scale ($20/month)** when needed
4. Create initial database project named "foldly-prod"

#### **What Developer Needs:**

- Database connection string
- Access to Neon dashboard
- Ability to create database branches for development

#### **Monthly Cost:**

- **Development**: $0 (Free tier - 512MB storage)
- **Production**: $20/month (Scale plan - 10GB storage)

---

### **3. Clerk - Authentication Service**

**Purpose**: User authentication, sign-up/sign-in, user management

#### **Setup Steps:**

1. Go to [clerk.com](https://clerk.com)
2. Sign up for account
3. **Plan**: Start with **Free tier** (10,000 MAU), upgrade to **Pro ($25/month)** when scaling
4. Create new application named "Foldly"
5. Enable social login providers (Google, GitHub recommended)

#### **What Developer Needs:**

- Clerk application ID
- API keys (publishable and secret)
- Access to Clerk dashboard

#### **Monthly Cost:**

- **Development**: $0 (Free tier - up to 10K users)
- **Scale**: $25/month (Pro plan - unlimited users)

---

### **4. AWS - File Storage & CDN**

**Purpose**: S3 for file storage, CloudFront for global file delivery

#### **Setup Steps:**

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Create AWS account (requires credit card)
3. **Services to enable**:
   - **S3** (Simple Storage Service)
   - **CloudFront** (Content Delivery Network)
   - **IAM** (Identity and Access Management)
4. Create S3 bucket named "foldly-uploads-prod"
5. Set up CloudFront distribution for the S3 bucket

#### **What Developer Needs:**

- AWS Access Key ID
- AWS Secret Access Key
- S3 bucket name
- CloudFront distribution URL

#### **Monthly Cost:**

- **Development**: $5-10/month (minimal usage)
- **Production**: $20-50/month (100GB-1TB storage + bandwidth)

---

### **5. Stripe - Payment Processing**

**Purpose**: Handle subscription payments and billing

#### **Setup Steps:**

1. Go to [stripe.com](https://stripe.com)
2. Create Stripe account
3. **Plan**: Pay-per-transaction (2.9% + 30¢ per successful charge)
4. Complete account verification (may take 1-2 business days)
5. Set up webhook endpoints (developer will provide URLs)

#### **What Developer Needs:**

- Stripe publishable key
- Stripe secret key
- Webhook signing secret
- Access to Stripe dashboard

#### **Monthly Cost:**

- **No monthly fee**: 2.9% + 30¢ per transaction
- **Estimated**: $50-200/month based on revenue

---

### **6. Resend - Email Service**

**Purpose**: Transactional emails (notifications, confirmations, etc.)

#### **Setup Steps:**

1. Go to [resend.com](https://resend.com)
2. Sign up for account
3. **Plan**: Start with **Free tier** (3,000 emails/month), upgrade to **Pro ($20/month)** when needed
4. Verify domain for email sending (developer will assist)

#### **What Developer Needs:**

- Resend API key
- Domain verification records
- Access to email analytics

#### **Monthly Cost:**

- **Development**: $0 (Free tier - 3K emails)
- **Production**: $20/month (Pro plan - 50K emails)

---

### **7. Cloudflare - DNS & Security (Optional but Recommended)**

**Purpose**: DNS management, DDoS protection, performance optimization

#### **Setup Steps:**

1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up for account
3. **Plan**: Start with **Free tier**, upgrade to **Pro ($20/month)** for production
4. Add domain to Cloudflare (if not using Vercel domains)
5. Update nameservers with domain registrar

#### **What Developer Needs:**

- Cloudflare account access
- DNS management permissions
- API tokens for automation

#### **Monthly Cost:**

- **Free tier**: $0 (basic features)
- **Pro plan**: $20/month (advanced security & analytics)

---

### **8. Sentry - Error Monitoring**

**Purpose**: Track and monitor application errors in production

#### **Setup Steps:**

1. Go to [sentry.io](https://sentry.io)
2. Sign up with GitHub account
3. **Plan**: Start with **Free tier**, upgrade to **Team ($26/month)** when needed
4. Create new project for "Foldly"

#### **What Developer Needs:**

- Sentry DSN (Data Source Name)
- Project configuration access
- Error alert preferences

#### **Monthly Cost:**

- **Development**: $0 (Free tier - 5K errors/month)
- **Production**: $26/month (Team plan - 50K errors/month)

---

## 💰 **Total Cost Summary**

### **Development Phase (Months 1-2)**

```
Vercel Free:        $0/month
Neon Free:         $0/month
Clerk Free:        $0/month
AWS Minimal:       $5/month
Stripe:            $0/month (no transactions)
Resend Free:       $0/month
Cloudflare Free:   $0/month
Sentry Free:       $0/month
------------------------
TOTAL:             $5/month
```

### **Production Phase (Months 3+)**

```
Vercel Pro:        $20/month
Neon Scale:        $20/month
Clerk Pro:         $25/month
AWS Production:    $35/month
Stripe:            2.9% + 30¢/transaction
Resend Pro:        $20/month
Cloudflare Pro:    $20/month
Sentry Team:       $26/month
------------------------
TOTAL:             $166/month + transaction fees
```

### **Revenue Break-even Analysis**

- **Target Revenue**: $2,450/month (by month 6)
- **Operating Costs**: $166/month
- **Gross Margin**: 93%+ (excellent for SaaS)

---

## ✅ **Setup Checklist**

### **Week 1 - Development Setup**

- [ ] Vercel account created and GitHub connected
- [ ] Neon database project created
- [ ] Clerk application configured
- [ ] AWS account created with S3 bucket
- [ ] All API keys securely shared with developer

### **Week 2 - Integration Setup**

- [ ] Stripe account verified and configured
- [ ] Resend account created and domain verified
- [ ] All webhook endpoints configured
- [ ] Test transactions completed

### **Week 3 - Production Preparation**

- [ ] Cloudflare DNS configured (if using)
- [ ] Sentry error monitoring setup
- [ ] All production plans activated
- [ ] Security review completed

---

## 🔐 **Security & Access Management**

### **API Key Management**

- **Use a secure password manager** (1Password, Bitwarden)
- **Share keys securely** with developer (never via email/Slack)
- **Enable 2FA** on all service accounts
- **Regular key rotation** (quarterly recommended)

### **Account Access**

- **Primary account**: Employer maintains ownership
- **Developer access**: Invite as team member/collaborator
- **Billing alerts**: Set up spend notifications
- **Backup access**: Ensure multiple team members can access critical accounts

---

## 📞 **Next Steps**

1. **Priority 1**: Set up Vercel, Neon, and Clerk accounts (needed for development start)
2. **Share credentials**: Securely provide API keys to developer
3. **Schedule setup review**: 30-minute call to verify all services are configured
4. **Begin development**: Developer can start building once Phase 1 services are ready

**Estimated setup time**: 2-4 hours spread across 1-2 weeks

---

**Questions?** Contact the development team for assistance with any setup steps or technical configuration.

_Last updated: January 2025_
