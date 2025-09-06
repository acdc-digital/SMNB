# Live Feed Components

This directory contains components for the live feed system that processes and displays Reddit content in real-time.

## Core Components

### `SimpleLiveFeedCSSAnimated.tsx`
- **Status**: ✅ Active (used in `/app/dashboard/feed/FeedSidebar.tsx`)
- **Purpose**: Main live feed component with CSS-based animations
- **Features**: 
  - Live/history view toggle
  - Professional history cards with straight corners
  - Enhanced post processing pipeline integration
  - CSS animations with reduced motion support

### `PostCardAnimated.tsx`
- **Status**: ✅ Active (used by `StoryThreadBadgeDemo.tsx`)
- **Purpose**: Reusable animated post card component
- **Features**: CSS animations, hover effects, badge system

## Test/Demo Components

### `StoryThreadBadgeDemo.tsx`
- **Status**: ✅ Active (test page at `/test-badges`)
- **Purpose**: Demo for story thread badge system
- **Usage**: Testing UI components and badge behaviors

### `StoryThreadWorkflowTest.tsx`
- **Status**: ✅ Active (test page at `/test-threads`)
- **Purpose**: Test component for story thread workflow
- **Usage**: Testing story thread processing and updates

## Documentation

### `animation-status.md`
- Documents the decision to use CSS animations instead of Framer Motion
- Explains TypeScript/React 19 compatibility issues with Framer Motion

## Recently Cleaned Up

Removed duplicate files that were superseded by the CSS animated version:
- ~~`SimpleLiveFeed.tsx`~~ - Basic version without animations
- ~~`SimpleLiveFeedAnimated.tsx`~~ - Framer Motion version (incompatible)

