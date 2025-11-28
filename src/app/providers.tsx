"use client";

import { ConvexProvider } from "convex/react";
import { ReactNode } from "react";
import convex from "@/convexClient";

export default function Providers({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
