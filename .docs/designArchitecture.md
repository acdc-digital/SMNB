# SMNB Dashboard Architecture Analysis

## Overview

This document provides a comprehensive analysis of our Reddit Live Feed dashboard design system, adapted from the AURA project's IDE-style interface. This serves as the foundation for maintaining consistent, professional UI components throughout the SMNB application.

## 1. Layout Structure

The SMNB application follows a VS Code-inspired dual-layout pattern:

```
┌────────────────────────┬────────────────────┐
│    LIVE FEED SIDEBAR   │    MAIN DASHBOARD  │
│                        │                    │
│    📡 Reddit Posts     │   Column Layout    │
│    (Animated Cards)    │   ┌─────┬─────┐    │
│                        │   │  A  │  B  │    │
│                        │   └─────┴─────┘    │
│                        │                    │
│                        │   🎛️ CONTROLS      │
│                        │   (Unified Panel)  │
└────────────────────────┴────────────────────┘
```

### Core Components:

1. **Live Feed Sidebar** - Real-time Reddit post stream with animations
2. **Main Dashboard** - Two-column content area with unified control panel
3. **Controls Panel** - Professional DJ-style interface for feed management

## 2. Component Hierarchy & Dimensions

### Live Feed Sidebar

- **Width**: `33%` of viewport (min: `280px`, max: `520px`)
- **Background**: `var(--background)` with subtle border
- **Header**: Fixed at `44px` height with backdrop blur
- **Typography**: 
  - Title: `text-sm font-medium` with tracking
  - Content: Responsive text sizing

### Main Dashboard Area

- **Width**: `67%` of viewport
- **Background**: Translucent white/black with backdrop blur
- **Header**: Fixed at `48px` height
- **Content**: Flexible column layout with controls at bottom

### Controls Panel (Unified)

- **Background**: `var(--card)` with subtle border and shadow
- **Padding**: `24px` (p-6) for comfortable spacing
- **Border-radius**: `8px` (rounded-lg)
- **Structure**: Three-tier hierarchy (Status → Channels → Info)

## 3. Color System

```css
/* Adapted from Tailwind's semantic tokens */
--background: hsl(var(--background));
--foreground: hsl(var(--foreground));
--card: hsl(var(--card));
--card-foreground: hsl(var(--card-foreground));
--border: hsl(var(--border));
--muted: hsl(var(--muted));
--muted-foreground: hsl(var(--muted-foreground));
--secondary: hsl(var(--secondary));
--secondary-foreground: hsl(var(--secondary-foreground));

/* Status Colors */
--success: #10b981; /* Green for live/active states */
--warning: #f59e0b; /* Amber for warning states */
--error: #ef4444;   /* Red for error/stop states */
--info: #3b82f6;    /* Blue for information */
--purple: #8b5cf6;  /* Purple for custom elements */

/* Interactive States */
--hover-background: rgba(var(--foreground), 0.05);
--active-background: rgba(var(--primary), 0.1);
--focus-ring: hsl(var(--ring));
```

## 4. Control Panel Design Elements

### Typography System

```css
/* Headers */
.control-header {
  font-size: 1.25rem; /* text-xl */
  font-weight: 700;   /* font-bold */
  text-align: center;
  margin-bottom: 1.5rem; /* mb-6 */
}

/* Section Headers */
.section-header {
  font-size: 1.125rem; /* text-lg */
  font-weight: 600;    /* font-semibold */
  display: flex;
  align-items: center;
  gap: 0.5rem; /* gap-2 */
}

/* Status Text */
.status-text {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", monospace;
  font-size: 0.75rem; /* text-xs */
  line-height: 1;
}

/* Button Text */
.button-text {
  font-weight: 500; /* font-medium */
  font-size: 0.875rem; /* text-sm */
}
```

### Button System

```css
/* Primary Action Buttons */
.btn-primary {
  padding: 0.75rem 1.5rem; /* py-3 px-6 */
  border-radius: 0.5rem; /* rounded-lg */
  font-weight: 700; /* font-bold */
  font-size: 1.125rem; /* text-lg */
  transition: all 0.2s;
  transform-origin: center;
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

/* Channel Buttons */
.btn-channel {
  padding: 0.5rem 0.75rem; /* py-2 px-3 */
  border-radius: 9999px; /* rounded-full */
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* font-medium */
  display: inline-flex;
  align-items: center;
  gap: 0.5rem; /* gap-2 */
  transition: all 0.2s;
}

.btn-channel:hover {
  transform: scale(1.05);
}
```

### Status Indicators

```css
/* Live Indicator */
.status-live {
  width: 1rem; /* w-4 */
  height: 1rem; /* h-4 */
  border-radius: 50%;
  background: var(--success);
  animation: pulse 2s infinite;
  box-shadow: 0 0 0.5rem rgba(16, 185, 129, 0.5);
}

/* Channel Status Circles */
.channel-indicator {
  width: 0.75rem; /* w-3 */
  height: 0.75rem; /* h-3 */
  border-radius: 50%;
  transition: all 0.3s;
}

.channel-indicator.active {
  background: white; /* or current color */
}

.channel-indicator.inactive {
  border: 2px solid currentColor;
  background: transparent;
}
```

## 5. Interactive Components

### Control Panel Layout Structure

```tsx
// Three-tier hierarchy
<div className="controls-panel">
  {/* Tier 1: Status & Actions */}
  <div className="status-row">
    <StatusIndicator />
    <PrimaryActions />
    <ContentFilters />
    <InfoDisplay />
  </div>
  
  {/* Tier 2: Channel Management */}
  <div className="channels-grid">
    <DefaultChannels />
    <CustomChannels />
  </div>
  
  {/* Tier 3: Status Bar */}
  <div className="status-bar">
    <ActiveChannelsDisplay />
  </div>
</div>
```

### Animation Principles

```css
/* Smooth transitions for professional feel */
.interactive-element {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Scale animations for buttons */
.btn-interactive:hover {
  transform: scale(1.05);
}

/* Pulse animation for live indicators */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

## 6. Channel Management Design

### Default Channels Section

- **Background**: Light blue tint (`bg-blue-50 dark:bg-blue-950/30`)
- **Border**: Subtle blue border (`border-blue-200 dark:border-blue-800`)
- **Header**: Emoji icon + descriptive text
- **Layout**: Flex wrap for responsive channel pills

### Custom Channels Section

- **Background**: Light purple tint (`bg-purple-50 dark:bg-purple-950/30`)
- **Border**: Subtle purple border (`border-purple-200 dark:border-purple-800`)
- **Input**: Full-width with purple focus ring
- **Add Button**: Purple accent with hover effects

### Channel Pills Design

```css
.channel-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.channel-pill:hover {
  transform: scale(1.05);
}

.channel-pill.enabled {
  background: var(--accent-color);
  color: white;
  box-shadow: 0 4px 12px rgba(var(--accent-color), 0.3);
}

.channel-pill.disabled {
  background: var(--muted);
  color: var(--muted-foreground);
}
```

## 7. Responsive Behavior

### Breakpoint Strategy

- **Mobile** (`< 768px`): Stack columns vertically, compress control panel
- **Tablet** (`768px - 1024px`): Maintain layout, reduce sidebar width
- **Desktop** (`> 1024px`): Full layout with optimal proportions

### Sidebar Behavior

```tsx
// Responsive sidebar widths
const sidebarWidths = {
  mobile: 'hidden', // Hide on mobile, show toggle
  tablet: 'basis-2/5 min-w-[240px]',
  desktop: 'basis-1/3 min-w-[280px] max-w-[520px]'
}
```

## 8. Key Design Principles

1. **Minimal Elegance**: Clean lines, subtle shadows, purposeful spacing
2. **Functional Hierarchy**: Visual weight indicates importance
3. **Consistent Spacing**: 4px, 8px, 12px, 16px, 24px grid system
4. **Semantic Colors**: Colors convey meaning (green=live, red=stop, etc.)
5. **Smooth Interactions**: Micro-animations enhance user feedback
6. **Professional Aesthetic**: Suitable for extended professional use
7. **Accessibility First**: Proper contrast, focus indicators, semantic HTML

## 9. Component Patterns

### Status Display Pattern

```tsx
<div className="flex items-center gap-4">
  <div className="flex items-center gap-2">
    <StatusIndicator isLive={isLive} />
    <StatusText>{isLive ? 'LIVE' : 'STOPPED'}</StatusText>
  </div>
  <PrimaryActionButton />
</div>
```

### Channel Section Pattern

```tsx
<div className="p-4 bg-accent/5 rounded-lg border border-accent/20">
  <SectionHeader emoji="🎚️" title="Channel Category" />
  <ChannelGrid>
    {channels.map(channel => (
      <ChannelPill key={channel} {...channelProps} />
    ))}
  </ChannelGrid>
</div>
```

### Info Bar Pattern

```tsx
<div className="bg-muted/5 p-3 rounded-lg border border-muted/20">
  <div className="text-xs font-mono text-center text-muted-foreground">
    🔴 STATUS: {activeChannels.join(' • ')}
  </div>
</div>
```

## Implementation Guidelines

### CSS Custom Properties Integration

```tsx
// Use Tailwind's CSS variables for theme consistency
const controlPanelStyles = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--card-foreground))'
}
```

### Component Architecture

```tsx
// Recommended structure
export function ControlsPanel() {
  return (
    <div className="bg-card border border-border p-6 rounded-lg shadow-sm">
      <ControlsHeader />
      <StatusControls />
      <ChannelManagement />
      <StatusBar />
    </div>
  )
}
```

## Conclusion

This design system creates a professional, developer-focused Reddit feed management interface that prioritizes functionality while maintaining visual appeal. The design emphasizes:

- **Clean Minimalism**: No unnecessary visual noise
- **Functional Beauty**: Every element serves a clear purpose  
- **Professional Polish**: Suitable for extended daily use
- **Intuitive Interaction**: Clear feedback for all user actions
- **Scalable Architecture**: Consistent patterns across components

The system balances information density with readability, creating an interface that feels both powerful and approachable.

---

_Last updated: September 1, 2025_
_Adapted from AURA Design Architecture v1.0_
