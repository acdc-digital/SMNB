// CONVEX CLIENT PROVIDER
// /Users/matthewsimon/Projects/SMNB/smnb/components/providers/ConvexClientProvider.tsx

'use client';

import { ConvexProvider } from "convex/react";
import { ReactNode } from "react";
import convex from "@/lib/convex-client";

interface ConvexClientProviderProps {
  children: ReactNode;
}

export default function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
