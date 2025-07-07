# Clerk Authentication Setup Guide

## 🔐 Clerk Configuration (2025)

This guide helps you set up Clerk authentication for Foldly using the latest 2025 documentation and best practices.

## 📋 Prerequisites

- Node.js 18+ installed
- A Clerk account (sign up at [clerk.com](https://clerk.com))
- Completed development environment setup (Dependencies, Database)

## 🚀 Quick Setup

### 1. Create Clerk Application

1. Go to [clerk.com/dashboard](https://clerk.com/dashboard)
2. Click "Create Application"
3. Choose application name: **"Foldly"**
4. Select authentication methods:
   - ✅ Email
   - ✅ Google (recommended)
   - ✅ GitHub (optional)
5. Click "Create Application"

### 2. Get API Keys

From your Clerk dashboard:

1. Go to **API Keys** section
2. Copy the following keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_` or `pk_live_`)
   - `CLERK_SECRET_KEY` (starts with `sk_test_` or `sk_live_`)

### 3. Configure Environment Variables

Create `.env.local` file in project root:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
CLERK_SECRET_KEY="sk_test_your_secret_key_here"

# Clerk Configuration (Optional - Uses defaults)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/dashboard"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/dashboard"

# Your existing database variables...
DATABASE_URL="your_neon_database_url"
```

### 4. Configure Webhooks (Optional but Recommended)

For user data synchronization with your database:

1. In Clerk Dashboard → **Webhooks**
2. Click "Add Endpoint"
3. Endpoint URL: `https://your-domain.com/api/webhooks/clerk`
4. Select events:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
5. Copy the **Signing Secret**
6. Add to `.env.local`:

```bash
CLERK_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
```

## 🧪 Testing Authentication

### 1. Start Development Server

```bash
npm run dev
```

### 2. Test Authentication Flow

1. Navigate to `http://localhost:3000`
2. Click **"Sign In"** button in header
3. Complete sign-up or sign-in process
4. You should be redirected to `/dashboard`
5. Verify user data displays correctly

### 3. Test Protected Routes

1. Try accessing `/dashboard` without signing in
2. Should redirect to `/sign-in` automatically
3. Sign in and verify access is granted

## 🎨 Customization Options

### Authentication Pages Styling

The sign-in and sign-up pages use Foldly's brand colors:

```typescript
<SignIn
  appearance={{
    elements: {
      formButtonPrimary: 'bg-[#6c47ff] hover:bg-[#5a3dd9]',
      card: 'shadow-xl',
    },
  }}
/>
```

### User Button Customization

```typescript
<UserButton
  appearance={{
    elements: {
      avatarBox: 'w-10 h-10',
    },
  }}
  showName
/>
```

## 🔧 Advanced Configuration

### Custom Redirect URLs

Update in Clerk Dashboard → **Paths**:

- **Sign-in URL**: `/sign-in`
- **Sign-up URL**: `/sign-up`
- **After sign-in**: `/dashboard`
- **After sign-up**: `/dashboard`

### Social Connections

In Clerk Dashboard → **User & Authentication** → **Social Connections**:

1. **Google**: Recommended for professional users
2. **GitHub**: Good for developer audience
3. **Discord**: Optional for community features

### Multi-Factor Authentication

In Clerk Dashboard → **User & Authentication** → **Multi-factor**:

- ✅ Enable SMS verification
- ✅ Enable authenticator apps (TOTP)

## 🛠️ Troubleshooting

### Common Issues

**"Invalid publishable key"**

- Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_test_` or `pk_live_`
- Check for extra spaces or quotes in `.env.local`

**"Webhook signature verification failed"**

- Verify `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
- Ensure webhook endpoint is publicly accessible

**"Infinite redirect loop"**

- Check middleware configuration in `middleware.ts`
- Verify protected routes are correctly defined

### Development vs Production

**Development (localhost:3000)**:

- Use test keys (`pk_test_` and `sk_test_`)
- Webhook testing with ngrok or similar

**Production (your-domain.com)**:

- Use live keys (`pk_live_` and `sk_live_`)
- Update allowed origins in Clerk Dashboard

## ✅ Verification Checklist

- [ ] Clerk application created
- [ ] API keys added to `.env.local`
- [ ] Sign-in page accessible at `/sign-in`
- [ ] Sign-up page accessible at `/sign-up`
- [ ] Dashboard requires authentication
- [ ] User data displays in dashboard
- [ ] Sign-out functionality works
- [ ] Webhooks configured (optional)

## 📚 Next Steps

Once authentication is working:

1. **Extend database schemas** → Add upload links, files metadata
2. **Implement file upload** → UploadThing integration
3. **Create link management** → Custom upload links with expiration
4. **Set up E2E testing** → Test complete user workflows

---

**Need help?** Check [Clerk's documentation](https://clerk.com/docs) or see [TASK.md](TASK.md) for next development steps.
