# 🌐 URL Configuration System

> **Centralized URL management for multi-environment support**  
> **Status**: ✅ Complete - Production Ready  
> **Last Updated**: February 2025

## 🎯 **Overview**

Foldly implements a centralized URL configuration system that dynamically handles different environments without hardcoding domains. This system ensures seamless operation across local development, Vercel preview deployments, and production environments.

## 🏗️ **Architecture**

### **Core Configuration File**

Located at `/src/lib/config/url-config.ts`, the system provides:

1. **Dynamic Base URL Detection**
2. **Security Through Host Validation**
3. **Consistent URL Generation**
4. **Environment-Aware Configuration**

### **Priority Order for URL Detection**

```typescript
1. NEXT_PUBLIC_APP_URL (production)
2. NEXT_PUBLIC_VERCEL_URL (Vercel deployments)
3. window.location.origin (client-side)
4. VERCEL_URL (server-side Vercel)
5. http://localhost:3000 (fallback)
```

## 🔧 **Core Functions**

### **getBaseUrl()**

Returns the complete base URL with protocol for the current environment.

```typescript
import { getBaseUrl } from '@/lib/config/url-config';

const baseUrl = getBaseUrl();
// Development: "http://localhost:3000"
// Preview: "https://foldly-preview-abc123.vercel.app"
// Production: "https://foldly.com"
```

### **getDisplayDomain()**

Returns the domain without protocol for display purposes.

```typescript
import { getDisplayDomain } from '@/lib/config/url-config';

const domain = getDisplayDomain();
// Development: "localhost:3000"
// Preview: "foldly-preview-abc123.vercel.app"
// Production: "foldly.com"
```

### **generateLinkUrl()**

Generates complete URLs for links with optional topic/path.

```typescript
import { generateLinkUrl } from '@/lib/config/url-config';

// Base link
const baseLink = generateLinkUrl('myfiles');
// → "https://foldly.com/myfiles"

// Custom topic link
const topicLink = generateLinkUrl('portfolio', 'designs');
// → "https://foldly.com/portfolio/designs"

// Relative URL (for internal navigation)
const relativeLink = generateLinkUrl('myfiles', null, { absolute: false });
// → "/myfiles"
```

### **UrlBuilder Class**

Provides a fluent interface for building different types of URLs.

```typescript
import { urlBuilder } from '@/lib/config/url-config';

// Link URLs
const linkUrl = urlBuilder.link('portfolio', 'designs');
// → "https://foldly.com/portfolio/designs"

// API endpoints
const apiUrl = urlBuilder.api('/links/create');
// → "https://foldly.com/api/links/create"

// Static assets
const assetUrl = urlBuilder.static('/images/logo.png');
// → "https://foldly.com/images/logo.png"
```

## 🎨 **Client Components**

### **useLinkUrl Hook**

For client components that need to display or share link URLs.

```typescript
'use client';

import { useLinkUrl } from '@/features/links/hooks/use-link-url';

function LinkCard({ slug, topic }: LinkCardProps) {
  const { displayUrl, fullUrl, shareUrl } = useLinkUrl(slug, topic);
  
  return (
    <div>
      <p>Visit: {displayUrl}</p>
      {/* Shows: "foldly.com/portfolio/designs" */}
      
      <CopyButton value={fullUrl} />
      {/* Copies: "https://foldly.com/portfolio/designs" */}
      
      <ShareButton url={shareUrl} />
      {/* Shares: "https://foldly.com/portfolio/designs" */}
    </div>
  );
}
```

## 🔒 **Security Features**

### **Host Validation**

The system validates hosts to prevent header injection attacks:

```typescript
// Allowed hosts:
- localhost
- foldly.com
- foldly.io
- *.vercel.app
- *.foldly.com
- *.foldly.io
```

Any requests with invalid hosts are rejected, ensuring security across all environments.

## ⚙️ **Environment Configuration**

### **Development**

No configuration needed - automatically uses `localhost:3000`.

### **Vercel Preview Deployments**

Automatically detected through Vercel environment variables.

### **Production**

Set in your production environment:

```bash
NEXT_PUBLIC_APP_URL="https://foldly.com"
```

## 📋 **Migration Guide**

### **From Hardcoded Domains**

```typescript
// ❌ Old approach
const link = `https://foldly.com/${slug}`;
const domain = 'foldly.io';

// ✅ New approach
import { generateLinkUrl, getDisplayDomain } from '@/lib/config/url-config';

const link = generateLinkUrl(slug);
const domain = getDisplayDomain();
```

### **In Server Components**

```typescript
import { getBaseUrl } from '@/lib/config/url-config';

export default async function ServerComponent() {
  const baseUrl = getBaseUrl();
  const data = await fetch(`${baseUrl}/api/data`);
  // ...
}
```

### **In Client Components**

```typescript
'use client';

import { useLinkUrl } from '@/features/links/hooks/use-link-url';

export default function ClientComponent({ slug, topic }) {
  const { displayUrl, fullUrl } = useLinkUrl(slug, topic);
  // ...
}
```

## 🚀 **Best Practices**

1. **Never Hardcode Domains**: Always use the configuration system
2. **Use Appropriate Functions**: Choose between `getBaseUrl()` and `getDisplayDomain()` based on your needs
3. **Client vs Server**: Use `useLinkUrl` hook in client components
4. **Consistent URLs**: Use `generateLinkUrl()` for all link generation
5. **API Calls**: Use `urlBuilder.api()` for API endpoints

## 🐛 **Troubleshooting**

### **Wrong Domain in Development**

Ensure you haven't set `NEXT_PUBLIC_APP_URL` in your local `.env.local` file.

### **Preview Deployments Not Working**

Check that Vercel is providing the `NEXT_PUBLIC_VERCEL_URL` environment variable.

### **Client-Server Mismatch**

The system handles both client and server contexts automatically. If you see mismatches, ensure you're not mixing server-only code (like `headers()`) in client components.

## 📚 **Related Documentation**

- [Multi-Link System Implementation](./01-MULTI_LINK_SYSTEM.md)
- [Setup Guide](../setup/SETUP_GUIDE.md)
- [Architecture Overview](../architecture/ARCHITECTURE.md)