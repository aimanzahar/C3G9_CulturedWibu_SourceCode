import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";

export const signup = mutation({
  args: { email: v.string(), password: v.string(), name: v.string() },
  handler: async (ctx, args) =>
    ctx.runMutation(components.air.auth.signup, args),
});

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) =>
    ctx.runMutation(components.air.auth.login, args),
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) =>
    ctx.runMutation(components.air.auth.logout, args),
});

export const session = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => ctx.runQuery(components.air.auth.session, args),
});
