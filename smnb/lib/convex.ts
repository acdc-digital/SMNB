// CONVEX HTTP CLIENT
// /Users/matthewsimon/Projects/SMNB/smnb/lib/convex.ts

import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default convex;
