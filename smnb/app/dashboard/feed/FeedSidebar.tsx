// FEED SIDEBAR
// /Users/matthewsimon/Projects/SMNB/smnb/app/dashboard/feed/FeedSidebar.tsx

'use client';

import React from "react";
import SimpleLiveFeedCSSAnimated from "@/components/livefeed/SimpleLiveFeedCSSAnimated";

export default function FeedSidebar() {
  return (
    <aside className="relative basis-1/4 min-w-[280px] max-w-[380px] border-r border-black/10 dark:border-white/10 flex flex-col min-h-0 bg-background overflow-hidden">
      <div className="flex-1 overflow-auto pt-4 pb-4">
        <SimpleLiveFeedCSSAnimated className="h-full" />
      </div>
    </aside>
  );
}
