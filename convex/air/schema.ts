import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Component-scoped schema for air exposure tracking.
export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(), // salt:hash (sha256)
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  profiles: defineTable({
    userKey: v.string(),
    userId: v.optional(v.id("users")),
    nickname: v.optional(v.string()),
    homeCity: v.optional(v.string()),
    points: v.number(),
    streak: v.number(),
    bestStreak: v.number(),
    lastActiveDate: v.string(), // ISO date (yyyy-mm-dd)
  }).index("by_userKey", ["userKey"]),

  exposures: defineTable({
    profileId: v.id("profiles"),
    lat: v.number(),
    lon: v.number(),
    locationName: v.string(),
    timestamp: v.number(),
    pm25: v.optional(v.number()),
    no2: v.optional(v.number()),
    co: v.optional(v.number()),
    mode: v.optional(v.string()),
    riskLevel: v.string(),
    tips: v.array(v.string()),
    score: v.number(),
  }).index("by_profile", ["profileId"]),
});
