// FEED SIDEBAR
// /Users/matthewsimon/Projects/SMNB/smnb/app/dashboard/feed/FeedSidebar.tsx

'use client';

import React from "react";
import LiveFeed from "@/components/livefeed/liveFeed";
import Aggregator from "@/components/aggregator/aggregator";

export default function FeedSidebar() {
  return (
    <aside className="relative basis-1/4 min-w-[280px] max-w-[380px] border-r border-black/10 dark:border-white/10 flex flex-col min-h-0 bg-[#181818] overflow-hidden">
      {/* Background Aggregator - runs Reddit processing pipeline */}
      <Aggregator />
      
      {/* Visible Live Feed - displays published stories */}
      <div className="flex-1 overflow-auto pt-0 pb-0">
        <LiveFeed className="h-full" />
      </div>
    </aside>
  );
}
