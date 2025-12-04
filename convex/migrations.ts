import { mutation } from "./_generated/server";
import { components } from "./_generated/api";

export const fixInvalidUserIds = mutation({
  args: {},
  handler: async (ctx) =>
    ctx.runMutation(components.air.migrations.fixInvalidUserIds, {}),
});

