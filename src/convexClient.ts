"use client";

import { ConvexReactClient } from "convex/react";

const resolveConvexUrl = () => {
  const envUrl =
    process.env.NEXT_PUBLIC_CONVEX_URL ||
    process.env.NEXT_PUBLIC_CONVEX_SELF_HOSTED_URL ||
    process.env.CONVEX_SITE_URL ||
    process.env.CONVEX_SELF_HOSTED_URL ||
    "";

  if (envUrl) {
    // Prefer https in production to avoid mixed-content WebSocket failures.
    if (typeof window !== "undefined" && window.location.protocol === "https:") {
      return envUrl.replace(/^http:\/\//, "https://");
    }
    return envUrl;
  }

  // Development fallback only.
  if (process.env.NODE_ENV === "development") return "http://localhost:9876";

  throw new Error(
    "Convex URL is not set. Add NEXT_PUBLIC_CONVEX_URL (https) in your environment or docker-compose.",
  );
};

const url = resolveConvexUrl();

const convex = new ConvexReactClient(url);

export default convex;
