# Cloud Storage Integration Setup Guide

This guide explains how to set up Google Drive and OneDrive integration using Clerk's OAuth providers.

## Overview

The cloud storage integration allows users to:
- Connect their Google Drive and/or OneDrive accounts
- Browse and manage files from cloud storage
- Transfer files between cloud providers
- Sync files between Foldly and cloud storage

## Architecture

```
User → Clerk OAuth → Access Token → Cloud Provider API → Files
```

- **Clerk OAuth**: Handles authentication and token management
- **Server Actions**: Secure token retrieval and user settings management  
- **Provider Services**: Google Drive and OneDrive API implementations
- **React Hooks**: Client-side state management and file operations

## Setup Instructions

### Step 1: Configure Google OAuth in Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **SSO Connections**
3. Click **Add connection** → **For all users**
4. Select **Google** from the dropdown
5. Enable **Use custom credentials**

#### Google Cloud Console Setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Drive API**:
   - Go to APIs & Services → Library
   - Search for "Google Drive API"
   - Click Enable

4. Create OAuth 2.0 credentials:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: Web application
   - Add authorized redirect URIs:
     - Development: `https://your-app.clerk.accounts.dev/v1/oauth_callback`
     - Production: `https://your-domain.com/v1/oauth_callback`

5. Copy the Client ID and Client Secret

6. Back in Clerk Dashboard, add:
   - **Client ID**: Your Google OAuth client ID
   - **Client Secret**: Your Google OAuth client secret
   - **Additional Scopes**:
     ```
     https://www.googleapis.com/auth/drive.file
     https://www.googleapis.com/auth/drive.readonly
     ```

### Step 2: Configure Microsoft OAuth in Clerk

1. In Clerk Dashboard → **SSO Connections**
2. Click **Add connection** → **For all users**
3. Select **Microsoft** from the dropdown
4. Enable **Use custom credentials**

#### Azure Portal Setup:

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory → App registrations
3. Click "New registration"
   - Name: Your app name
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: Web platform
     - Development: `https://your-app.clerk.accounts.dev/v1/oauth_callback`
     - Production: `https://your-domain.com/v1/oauth_callback`

4. After creation, go to "Certificates & secrets"
   - Create a new client secret
   - Copy the secret value immediately

5. Go to "API permissions"
   - Click "Add a permission" → Microsoft Graph
   - Delegated permissions:
     - `Files.ReadWrite.All`
     - `offline_access`
     - `openid`
     - `profile`
     - `email`
   - Click "Grant admin consent" if required

6. Back in Clerk Dashboard, add:
   - **Client ID**: Application (client) ID from Azure
   - **Client Secret**: The secret value you copied
   - **Additional Scopes**:
     ```
     Files.ReadWrite.All
     offline_access
     ```

### Step 3: Environment Variables

Add these to your `.env.local` file (optional - only if you need them for other purposes):

```env
# These are managed by Clerk, but you can store them for reference
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
```

### Step 4: Database Migration

Run the database migration to update user settings schema:

```bash
npm run generate
npm run push
```

## Usage

### Basic Connection Component

```tsx
import { CloudStorageConnector } from '@/features/cloud-storage/components/cloud-storage-connector';

// Default variant
<CloudStorageConnector provider="google-drive" />

// Compact variant
<CloudStorageConnector provider="onedrive" variant="compact" />

// Icon variant
<CloudStorageConnector provider="google-drive" variant="icon" />
```

### Full Management Interface

```tsx
import { CloudStorageManager } from '@/features/cloud-storage/components/cloud-storage-manager';

// In your settings page
<CloudStorageManager />
```

### Using the Hook

```tsx
import { useCloudStorage } from '@/lib/services/cloud-storage/hooks/use-cloud-storage';

function MyComponent() {
  const {
    isConnected,
    connect,
    disconnect,
    files,
    uploadFile,
    downloadFile,
  } = useCloudStorage({ provider: 'google-drive' });

  // Use the cloud storage operations
}
```

### In User Profile

The Clerk UserProfile component automatically handles OAuth connections:

```tsx
import { UserProfile } from '@clerk/nextjs';

<UserProfile
  additionalOAuthScopes={{
    google: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.readonly',
    ],
    microsoft: ['Files.ReadWrite.All', 'offline_access'],
  }}
/>
```

## Security Considerations

1. **Token Storage**: OAuth tokens are managed by Clerk and never stored in your database
2. **Refresh Tokens**: Clerk automatically handles token refresh
3. **Scopes**: Only request the minimum necessary scopes
4. **User Consent**: Users must explicitly grant permissions
5. **Revocation**: Users can revoke access at any time through their profile

## Troubleshooting

### "Provider not connected" Error
- User needs to connect through UserProfile component
- Check if OAuth provider is properly configured in Clerk

### "Authentication failed" Error
- Token may have expired (Clerk should auto-refresh)
- User may have revoked access
- Check OAuth app configuration

### No files showing
- Verify the scopes are correctly configured
- Check if user has granted all permissions
- Ensure API is enabled in Google Cloud Console / Azure

## API Rate Limits

- **Google Drive**: 1,000,000,000 requests per day
- **OneDrive**: 
  - 5,000 requests per 1-hour rolling window per app
  - 10,000 requests per 10-minute rolling window per user

## Development Tips

1. Use development instances in Clerk for testing
2. Test with multiple accounts to ensure proper isolation
3. Monitor OAuth token expiration and refresh behavior
4. Implement proper error handling for API failures
5. Cache file listings to reduce API calls

## Future Enhancements

- [ ] Automatic file syncing
- [ ] Conflict resolution for duplicate files
- [ ] Bulk file operations
- [ ] Background sync with progress tracking
- [ ] File preview generation
- [ ] Selective folder syncing
- [ ] Two-way sync capabilities