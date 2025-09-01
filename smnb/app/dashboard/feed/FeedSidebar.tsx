'use client';

import React from "react";
import SimpleLiveFeedCSSAnimated from "@/components/livefeed/SimpleLiveFeedCSSAnimated";

export default function FeedSidebar() {
  return (
    <aside className="relative basis-1/3 min-w-[280px] max-w-[520px] border-r border-black/10 dark:border-white/10 flex flex-col min-h-0 bg-background overflow-hidden">
      <div className="flex-1 overflow-auto pt-4 pb-4">
        <SimpleLiveFeedCSSAnimated className="h-full" />
      </div>
    </aside>
  );
}
