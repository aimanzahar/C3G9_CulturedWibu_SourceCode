import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";

export const ensureProfile = mutation({
  args: {
    userKey: v.string(),
    nickname: v.optional(v.string()),
    homeCity: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    ctx.runMutation(components.air.passport.ensureProfile, args),
});

export const logExposure = mutation({
  args: {
    userKey: v.string(),
    lat: v.number(),
    lon: v.number(),
    locationName: v.string(),
    pm25: v.optional(v.number()),
    no2: v.optional(v.number()),
    co: v.optional(v.number()),
    mode: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) =>
    ctx.runMutation(components.air.passport.logExposure, args),
});

export const getPassport = query({
  args: { userKey: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) =>
    ctx.runQuery(components.air.passport.getPassport, args),
});

export const insights = query({
  args: { userKey: v.string() },
  handler: async (ctx, args) =>
    ctx.runQuery(components.air.passport.insights, args),
});
