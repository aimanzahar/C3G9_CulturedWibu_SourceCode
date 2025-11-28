/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as passport from "../passport.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  passport: typeof passport;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  air: {
    auth: {
      login: FunctionReference<
        "mutation",
        "internal",
        { email: string; password: string },
        any
      >;
      logout: FunctionReference<"mutation", "internal", { token: string }, any>;
      session: FunctionReference<"query", "internal", { token?: string }, any>;
      signup: FunctionReference<
        "mutation",
        "internal",
        { email: string; name: string; password: string },
        any
      >;
    };
    passport: {
      ensureProfile: FunctionReference<
        "mutation",
        "internal",
        { homeCity?: string; nickname?: string; userKey: string },
        any
      >;
      getPassport: FunctionReference<
        "query",
        "internal",
        { limit?: number; userKey: string },
        any
      >;
      insights: FunctionReference<
        "query",
        "internal",
        { userKey: string },
        any
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
        any
      >;
    };
  };
};
