'use client';

import { Button } from '@/components/ui/shadcn/button';
import { useCloudStorage } from '../hooks/use-cloud-storage';
import { CloudIcon, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { Badge } from '@/components/ui/shadcn/badge';

interface CloudStorageConnectorProps {
  provider: 'google-drive' | 'onedrive';
  variant?: 'default' | 'compact' | 'icon';
  showStatus?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function CloudStorageConnector({ 
  provider, 
  variant = 'default',
  showStatus = true,
  onConnect,
  onDisconnect
}: CloudStorageConnectorProps) {
  const {
    isConnected,
    isConnecting,
    connectionError,
    email,
    connect,
    disconnect,
    files,
  } = useCloudStorage({ provider, autoConnect: false });

  const providerName = provider === 'google-drive' ? 'Google Drive' : 'OneDrive';
  const providerIcon = provider === 'google-drive' ? '🔷' : '☁️';

  const handleConnect = async () => {
    await connect();
    onConnect?.();
  };

  const handleDisconnect = async () => {
    await disconnect();
    onDisconnect?.();
  };

  if (variant === 'icon') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="relative"
          >
            <span className="text-xl">{providerIcon}</span>
            {isConnected && (
              <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{providerName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {isConnected ? (
            <>
              <DropdownMenuItem disabled>
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                Connected
              </DropdownMenuItem>
              {email && (
                <DropdownMenuItem disabled>
                  <span className="text-xs text-muted-foreground">{email}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDisconnect}>
                <XCircle className="mr-2 h-4 w-4" />
                Disconnect
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CloudIcon className="mr-2 h-4 w-4" />
              )}
              Connect
            </DropdownMenuItem>
          )}
          {files.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <span className="text-xs text-muted-foreground">
                  {files.length} files available
                </span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg">{providerIcon}</span>
        {isConnected ? (
          <>
            <Badge variant="outline" className="text-xs">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Connected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              className="h-7 px-2 text-xs"
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
            className="h-7 text-xs"
          >
            {isConnecting ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <CloudIcon className="mr-1 h-3 w-3" />
            )}
            Connect
          </Button>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{providerIcon}</span>
          <div>
            <h3 className="font-medium">{providerName}</h3>
            {showStatus && (
              <p className="text-sm text-muted-foreground">
                {isConnected ? `Connected as ${email}` : 'Not connected'}
              </p>
            )}
          </div>
        </div>
        
        {isConnected ? (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Connected
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="sm"
          >
            {isConnecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CloudIcon className="mr-2 h-4 w-4" />
            )}
            Connect
          </Button>
        )}
      </div>

      {connectionError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2">
          <p className="text-xs text-destructive">{connectionError}</p>
        </div>
      )}

      {isConnected && files.length > 0 && showStatus && (
        <p className="text-sm text-muted-foreground">
          {files.length} files available for sync
        </p>
      )}
    </div>
  );
}