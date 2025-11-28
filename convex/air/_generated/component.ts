/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    auth: {
      login: FunctionReference<
        "mutation",
        "internal",
        { email: string; password: string },
        any,
        Name
      >;
      logout: FunctionReference<
        "mutation",
        "internal",
        { token: string },
        any,
        Name
      >;
      session: FunctionReference<
        "query",
        "internal",
        { token?: string },
        any,
        Name
      >;
      signup: FunctionReference<
        "mutation",
        "internal",
        { email: string; name: string; password: string },
        any,
        Name
      >;
    };
    passport: {
      ensureProfile: FunctionReference<
        "mutation",
        "internal",
        { homeCity?: string; nickname?: string; userKey: string },
        any,
        Name
      >;
      getPassport: FunctionReference<
        "query",
        "internal",
        { limit?: number; userKey: string },
        any,
        Name
      >;
      insights: FunctionReference<
        "query",
        "internal",
        { userKey: string },
        any,
        Name
      >;
      logExposure: FunctionReference<
        "mutation",
        "internal",
        {
          co?: number;
          lat: number;
          locationName: string;
          lon: number;
          mode?: string;
          no2?: number;
          pm25?: number;
          timestamp?: number;
          userKey: string;
        },
        any,
        Name
      >;
    };
  };
