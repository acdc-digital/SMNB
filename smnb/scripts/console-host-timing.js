// Console helper for adjusting Host timing
// Copy and paste this into the browser console on the dashboard page

window.hostTiming = {
  
  // Apply timing presets
  fast: function() {
    try {
      const hostStore = window.useHostAgentStore?.getState();
      const hostService = hostStore?.service;
      
      if (!hostService) {
        console.error("❌ Host service not found. Make sure you're on the dashboard and the host agent is available.");
        return;
      }
      
      hostService.applyTimingPreset('fast');
      console.log("🏃‍♂️ Applied FAST timing preset");
      this.showCurrentTiming();
    } catch (error) {
      console.error("❌ Error applying fast preset:", error);
    }
  },
  
  normal: function() {
    try {
      const hostStore = window.useHostAgentStore?.getState();
      const hostService = hostStore?.service;
      
      if (!hostService) {
        console.error("❌ Host service not found");
        return;
      }
      
      hostService.applyTimingPreset('normal');
      console.log("🚶‍♂️ Applied NORMAL timing preset (~250 WPM)");
      this.showCurrentTiming();
    } catch (error) {
      console.error("❌ Error applying normal preset:", error);
    }
  },
  
  professional: function() {
    try {
      const hostStore = window.useHostAgentStore?.getState();
      const hostService = hostStore?.service;
      
      if (!hostService) {
        console.error("❌ Host service not found");
        return;
      }
      
      hostService.applyTimingPreset('professional');
      console.log("🎯 Applied PROFESSIONAL timing preset (314 WPM - PERFECT!)");
      this.showCurrentTiming();
    } catch (error) {
      console.error("❌ Error applying professional preset:", error);
    }
  },
  
  slow: function() {
    try {
      const hostStore = window.useHostAgentStore?.getState();
      const hostService = hostStore?.service;
      
      if (!hostService) {
        console.error("❌ Host service not found");
        return;
      }
      
      hostService.applyTimingPreset('slow');
      console.log("🐌 Applied SLOW timing preset (current default)");
      this.showCurrentTiming();
    } catch (error) {
      console.error("❌ Error applying slow preset:", error);
    }
  },
  
  deliberate: function() {
    try {
      const hostStore = window.useHostAgentStore?.getState();
      const hostService = hostStore?.service;
      
      if (!hostService) {
        console.error("❌ Host service not found");
        return;
      }
      
      hostService.applyTimingPreset('deliberate');
      console.log("🧘‍♂️ Applied DELIBERATE timing preset (very slow)");
      this.showCurrentTiming();
    } catch (error) {
      console.error("❌ Error applying deliberate preset:", error);
    }
  },
  
  // Show current timing settings
  showCurrentTiming: function() {
    try {
      const hostStore = window.useHostAgentStore?.getState();
      const hostService = hostStore?.service;
      
      if (!hostService) {
        console.error("❌ Host service not found");
        return;
      }
      
      const config = hostService.getTimingConfig();
      console.log(`
⚙️ CURRENT HOST TIMING CONFIGURATION
=====================================
⏳ Narration Cooldown: ${config.NARRATION_COOLDOWN_MS}ms (${config.NARRATION_COOLDOWN_MS/1000}s)
🔄 Queue Retry Delay: ${config.QUEUE_RETRY_DELAY_MS}ms (${config.QUEUE_RETRY_DELAY_MS/1000}s)
⌨️  Character Streaming: ${config.CHARACTER_STREAMING_DELAY_MS}ms per character (~${Math.round(1000/(config.CHARACTER_STREAMING_DELAY_MS/5))} WPM)
📡 Live Chunk Streaming: ${config.LIVE_STREAMING_CHUNK_DELAY_MS}ms per chunk
🎬 Pre-Narration Delay: ${config.PRE_NARRATION_DELAY_MS}ms (${config.PRE_NARRATION_DELAY_MS/1000}s)
🏁 Post-Narration Delay: ${config.POST_NARRATION_DELAY_MS}ms (${config.POST_NARRATION_DELAY_MS/1000}s)
      `);
    } catch (error) {
      console.error("❌ Error getting timing config:", error);
    }
  },
  
  // Custom timing adjustment
  custom: function(options = {}) {
    try {
      const hostStore = window.useHostAgentStore?.getState();
      const hostService = hostStore?.service;
      
      if (!hostService) {
        console.error("❌ Host service not found");
        return;
      }
      
      hostService.updateTimingConfig(options);
      console.log("⚙️ Applied custom timing configuration:", options);
      this.showCurrentTiming();
    } catch (error) {
      console.error("❌ Error applying custom config:", error);
    }
  }
};

console.log(`
🎛️ HOST TIMING CONTROL PANEL LOADED
===================================

Available commands:
🏃‍♂️ hostTiming.fast()         - Fast pacing (~400 WPM, 1s cooldown)
🚶‍♂️ hostTiming.normal()       - Normal pacing (~250 WPM, 3s cooldown)
🎯 hostTiming.professional()  - Professional news delivery (314 WPM) ⭐
🐌 hostTiming.slow()         - Slow pacing (~200 WPM, 5s cooldown) [CURRENT]
🧘‍♂️ hostTiming.deliberate()    - Very slow (~133 WPM, 8s cooldown)

📊 hostTiming.showCurrentTiming() - Show current settings

⚙️ Custom timing:
hostTiming.custom({
  CHARACTER_STREAMING_DELAY_MS: 38,    // 38ms = 314 WPM (professional)
  LIVE_STREAMING_CHUNK_DELAY_MS: 76,   // 76ms = 314 WPM for live chunks
  NARRATION_COOLDOWN_MS: 4000,         // Time between narrations
  PRE_NARRATION_DELAY_MS: 1000         // Pause before starting
});

🎯 RECOMMENDED: Use hostTiming.professional() for 314 WPM!
Current timing preset: PROFESSIONAL (314 WPM) - Character-by-character streaming enabled
`);

// Show current timing on load
window.hostTiming.showCurrentTiming();