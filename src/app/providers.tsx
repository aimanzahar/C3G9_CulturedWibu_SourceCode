"use client";

import { ConvexProvider } from "convex/react";
import { ReactNode } from "react";
import convex from "@/convexClient";
import { AuthProvider } from "@/contexts/AuthContext";
import ConvexErrorBoundary from "@/components/ConvexErrorBoundary";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexErrorBoundary>
      <ConvexProvider client={convex}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ConvexProvider>
    </ConvexErrorBoundary>
  );
}
