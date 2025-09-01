'use client';

import React from 'react';
import Host from './host/Host';
import Producer from './producer/Producer';
import Controls from './controls/Controls';

export default function Studio() {
  return (
    <main className="relative flex-1 flex flex-col min-h-0 bg-white/70 dark:bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30 overflow-hidden">
      <div className="flex-1 overflow-auto pt-6 pb-4">
        <div className="px-6 pb-4 h-full flex flex-col">
          
          {/* Two Column Layout */}
          <div className="flex gap-4 mb-6 flex-1">
            <Host />
            <Producer />
          </div>

          {/* Controls Panel */}
          <Controls />
          
        </div>
      </div>
    </main>
  );
}


