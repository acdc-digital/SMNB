// STUDIO
// /Users/matthewsimon/Projects/SMNB/smnb/app/dashboard/studio/Studio.tsx

'use client';

import React from 'react';
import Host from './host/Host';
// import Editor from './editor/Editor'; // Commented out - editor functionality disabled
import Producer from './producer/Producer';
import Controls from './controls/Controls';

// export type StudioMode = 'host' | 'editor'; // Commented out - only host mode available
export type StudioMode = 'host';

export default function Studio() {
  // const [mode, setMode] = useState<StudioMode>('host'); // Commented out - always host mode
  const mode: StudioMode = 'host'; // Always host mode

  return (
    <main className="relative flex-1 flex flex-col bg-white/70 dark:bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-black/30">
      <div className="flex-1 flex flex-col p-4 min-h-0">
        
        {/* Two Column Layout - Takes remaining space above controls */}
        <div className="flex-1 flex gap-4 mb-4 min-h-0">
          {/* Column 1 - Host only (editor functionality disabled) */}
          {/* {mode === 'host' ? <Host /> : <Editor />} // Commented out - always show Host */}
          <Host />
          
          {/* Column 2 - Producer */}
          <Producer />
        </div>

        {/* Controls Panel - Pinned to bottom */}
        <div className="flex-shrink-0 max-h-70 overflow-y-auto pb-0">
          {/* <Controls mode={mode} onModeChange={setMode} /> // Commented out - no mode switching */}
          <Controls mode={mode} onModeChange={() => {}} /> {/* No-op for mode change */}
        </div>
        
      </div>
    </main>
  );
}


