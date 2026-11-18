'use client';

import { useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOffline';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export function NetworkStatusIndicator() {
  const { online, syncStatus, forceSync } = useOnlineStatus();
  const [showDetails, setShowDetails] = useState(false);

  const totalPending = syncStatus.pending + syncStatus.syncing + syncStatus.errors + syncStatus.conflicts;

  if (online && totalPending === 0) {
    return (
      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400" title="En ligne - Tout synchronisé">
        <Wifi className="w-4 h-4" />
        <span className="text-xs font-medium hidden sm:inline">En ligne</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'gap-1.5 px-2 py-1',
          online ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
        )}
        onClick={() => setShowDetails(!showDetails)}
        aria-label={online ? 'Synchronisation en cours' : 'Hors ligne - Cliquer pour détails'}
      >
        {online ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-medium hidden sm:inline">Synchronisation</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">Hors ligne</span>
          </>
        )}
      </Button>

      {showDetails && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-popover border shadow-lg rounded-lg p-3 z-50">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm">
              {online ? 'Synchronisation en cours' : 'Mode hors ligne'}
            </h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDetails(false)}
              className="h-6 w-6"
            >
              <span className="sr-only">Fermer</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>En attente</span>
              <span className="font-medium">{syncStatus.pending}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>En cours</span>
              <span className="font-medium">{syncStatus.syncing}</span>
            </div>
            {syncStatus.errors > 0 && (
              <div className="flex justify-between text-destructive">
                <span>Erreurs</span>
                <span className="font-medium">{syncStatus.errors}</span>
              </div>
            )}
            {syncStatus.conflicts > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Conflits</span>
                <span className="font-medium">{syncStatus.conflicts}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t flex gap-2">
            <Button
              variant={online ? 'outline' : 'secondary'}
              size="sm"
              className="flex-1"
              onClick={forceSync}
              disabled={syncStatus.syncing > 0}
            >
              {syncStatus.syncing > 0 ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Synchronisation...
                </>
              ) : (
                'Synchroniser maintenant'
              )}
            </Button>
          </div>

          {!online && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Les données sont stockées localement et seront synchronisées automatiquement à la reconnexion.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Badge version for compact spaces (header)
export function NetworkStatusBadge() {
  const { online, syncStatus } = useOnlineStatus();
  const totalPending = syncStatus.pending + syncStatus.syncing + syncStatus.errors + syncStatus.conflicts;

  if (online && totalPending === 0) {
    return (
      <span className="flex items-center gap-1 text-green-600 dark:text-green-400" title="En ligne">
        <Wifi className="w-3.5 h-3.5" />
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1" title={online ? 'Synchronisation' : 'Hors ligne'}>
      {online ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
      ) : (
        <WifiOff className="w-3.5 h-3.5 text-red-600" />
      )}
      {totalPending > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
          {totalPending > 9 ? '9+' : totalPending}
        </span>
      )}
    </span>
  );
}