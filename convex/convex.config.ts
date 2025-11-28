import { defineApp } from "convex/server";
import air from "./air/convex.config";

const app = defineApp();

// Install the local "air" component that powers the exposure passport.
app.use(air);

export default app;
