"use client";

import { ConvexReactClient } from "convex/react";

const url =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  process.env.NEXT_PUBLIC_CONVEX_SELF_HOSTED_URL ||
  process.env.CONVEX_SITE_URL ||
  process.env.CONVEX_SELF_HOSTED_URL ||
  "http://localhost:9876";

const convex = new ConvexReactClient(url);

export default convex;
