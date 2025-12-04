import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// One-time migration to fix profiles with invalid userId values
export const fixInvalidUserIds = mutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    let fixedCount = 0;

    for (const profile of profiles) {
      if (profile.userId !== undefined) {
        // Try to verify if userId is a valid reference to a user
        try {
          const user = await ctx.db.get(profile.userId as Id<"users">);
          if (!user) {
            // userId doesn't reference an existing user - clear it
            await ctx.db.patch(profile._id, { userId: undefined });
            fixedCount++;
          }
        } catch {
          // Invalid ID format - clear it
          await ctx.db.patch(profile._id, { userId: undefined });
          fixedCount++;
        }
      }
    }

    return { fixedCount, totalProfiles: profiles.length };
  },
});

