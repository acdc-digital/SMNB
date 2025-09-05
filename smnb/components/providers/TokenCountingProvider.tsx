// TOKEN COUNTING PROVIDER
// /Users/matthewsimon/Projects/SMNB/smnb/components/providers/TokenCountingProvider.tsx

/**
 * Provider that connects the token counting service with Convex
 * Ensures proper initialization and data persistence
 */

'use client';

import React, { useEffect } from 'react';
import { useConvex } from 'convex/react';
import { tokenCountingService } from '@/lib/services/tokenCountingService';

interface TokenCountingProviderProps {
  children: React.ReactNode;
}

export const TokenCountingProvider: React.FC<TokenCountingProviderProps> = ({ children }) => {
  const convex = useConvex();

  useEffect(() => {
    if (convex) {
      // Connect the token counting service to Convex
      tokenCountingService.setConvexClient(convex);
    }
  }, [convex]);

  return <>{children}</>;
};