import { createContext, useContext, type ReactNode } from 'react';
import type { TravelDetail } from '@repo/api-client';

interface TravelContextValue {
  travel: TravelDetail;
  isOwner: boolean;
  currentUserId: string | null;
  onOpenNavigationSheet?: () => void;
}

const TravelContext = createContext<TravelContextValue | null>(null);

export function TravelProvider({
  travel,
  isOwner,
  currentUserId,
  onOpenNavigationSheet,
  children,
}: TravelContextValue & { children: ReactNode }) {
  return (
    <TravelContext.Provider value={{ travel, isOwner, currentUserId, onOpenNavigationSheet }}>
      {children}
    </TravelContext.Provider>
  );
}

export function useTravelContext(): TravelContextValue {
  const ctx = useContext(TravelContext);
  if (!ctx) {
    throw new Error('useTravelContext must be used within a TravelProvider');
  }
  return ctx;
}
