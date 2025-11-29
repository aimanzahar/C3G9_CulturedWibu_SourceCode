import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { components } from "./_generated/api";

// ============================================================================
// Health Profile Functions - Wrappers for Air Component
// These functions expose the air component's health profile functionality
// as public functions accessible from the client.
// ============================================================================

// Get health profile for a user
export const getHealthProfile = query({
  args: { userKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.air.healthProfile.getHealthProfile, args);
  },
});

// Check if health profile is complete
export const isHealthProfileComplete = query({
  args: { userKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runQuery(components.air.healthProfile.isHealthProfileComplete, args);
  },
});

// Create or update health profile
export const saveHealthProfile = mutation({
  args: {
    userKey: v.string(),
    name: v.optional(v.string()),
    age: v.optional(v.string()),
    gender: v.optional(v.string()),
    hasRespiratoryCondition: v.boolean(),
    conditions: v.array(v.string()),
    conditionSeverity: v.optional(v.string()),
    activityLevel: v.optional(v.string()),
    outdoorExposure: v.optional(v.string()),
    smokingStatus: v.optional(v.string()),
    livesNearTraffic: v.optional(v.boolean()),
    hasAirPurifier: v.optional(v.boolean()),
    isPregnant: v.optional(v.boolean()),
    hasHeartCondition: v.optional(v.boolean()),
    medications: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.air.healthProfile.saveHealthProfile, args);
  },
});

// Quick update for specific fields
export const updateHealthConditions = mutation({
  args: {
    userKey: v.string(),
    hasRespiratoryCondition: v.boolean(),
    conditions: v.array(v.string()),
    conditionSeverity: v.optional(v.string()),
    medications: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.air.healthProfile.updateHealthConditions, args);
  },
});

// Delete health profile
export const deleteHealthProfile = mutation({
  args: { userKey: v.string() },
  handler: async (ctx, args) => {
    return await ctx.runMutation(components.air.healthProfile.deleteHealthProfile, args);
  },
});
