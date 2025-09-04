// CONVEX CLIENT
// /Users/matthewsimon/Projects/SMNB/smnb/lib/convex-client.ts

import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default convex;
