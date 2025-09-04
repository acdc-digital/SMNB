'use client';

import React, { useState } from 'react';
import Host from './host/Host';
import Editor from './editor/Editor';
import Producer from './producer/Producer';
import Controls from './controls/Controls';

export type StudioMode = 'host' | 'editor';

export default function Studio() {
  const [mode, setMode] = useState<StudioMode>('host');

  return (
    <main className="relative flex-1 flex flex-col bg-white/70 dark:bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30">
      <div className="flex-1 flex flex-col p-4 min-h-0">
        
        {/* Two Column Layout - Takes remaining space above controls */}
        <div className="flex-1 flex gap-4 mb-4 min-h-0">
          {/* Column 1 - Host or Editor based on mode */}
          {mode === 'host' ? <Host /> : <Editor />}
          
          {/* Column 2 - Producer */}
          <Producer />
        </div>

        {/* Controls Panel - Pinned to bottom */}
        <div className="flex-shrink-0 max-h-70 overflow-y-auto pb-0">
          <Controls mode={mode} onModeChange={setMode} />
        </div>
        
      </div>
    </main>
  );
}


