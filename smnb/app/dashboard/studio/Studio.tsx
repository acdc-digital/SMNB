'use client';

import React from 'react';
import Host from './host/Host';
import Producer from './producer/Producer';
import Controls from './controls/Controls';

export default function Studio() {
  return (
    <main className="relative flex-1 flex flex-col bg-white/70 dark:bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30">
      <div className="flex-1 flex flex-col p-4 gap-4 min-h-0">
        
        {/* Two Column Layout */}
        <div className="flex gap-4 h-112 flex-shrink-0">
          <Host />
          <Producer />
        </div>

        {/* Controls Panel - Scrollable if needed */}
        <div className="flex-shrink-0 max-h-70 overflow-y-auto">
          <Controls />
        </div>
        
      </div>
    </main>
  );
}


