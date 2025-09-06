# Live Feed Components

This directory contains components for the live feed system that displays published stories from the Host/Editor.

## Core Components

### `liveFeed.tsx`
- **Status**: ✅ Active (used in `/app/dashboard/feed/FeedSidebar.tsx`)
- **Purpose**: Display component for published stories from Host/Editor
- **Features**: 
  - Story history display with rich metadata
  - Uses modular `StoryCard` component for consistent rendering
  - CSS animations with reduced motion support
  - Real-time updates from Convex story database

### `StoryCard.tsx` ⭐ **NEW**
- **Status**: ✅ Active (used by `liveFeed.tsx`)
- **Purpose**: Reusable story card component with design system integration
- **Features**:
  - Consistent visual design with theme variants
  - Accessibility support (ARIA labels, semantic HTML)
  - TypeScript interfaces for type safety
  - Integration with centralized utilities (`/lib/utils/storyUtils.ts`)
  - Support for story metadata (tone, priority, sentiment, topics, threads)

## Architecture Changes

The live feed system has been refactored to separate concerns:

- **Frontend Display**: `liveFeed.tsx` now only displays published stories (what users see)
- **Background Aggregation**: Reddit post processing moved to `/components/aggregator/aggregator.tsx`
- **Data Flow**: Reddit posts → Aggregator (background) → Host/Editor → Stories → Live Feed (display)

### Design System Refactoring ⭐ **NEW**

**Before**: Inline styling patterns with mixed concerns
- Story card rendering logic embedded in `liveFeed.tsx`
- Duplicate formatting functions (`getToneEmoji`, `getPriorityEmoji`)
- Hardcoded colors and styling decisions

**After**: Modular component architecture
- **`StoryCard` component**: Dedicated, reusable story card
- **`storyUtils.ts`**: Centralized utilities for formatting and styling
- **Design tokens**: Consistent color schemes and spacing
- **Theme system**: Support for different visual contexts

## Related Components

- **`/components/aggregator/aggregator.tsx`**: Background Reddit post processing
- **`/app/dashboard/feed/FeedSidebar.tsx`**: Combines aggregator + live feed display
- **`/lib/utils/storyUtils.ts`**: Story formatting utilities and design tokens

## Documentation

### `story-card-architecture.md` ⭐ **NEW**
- Comprehensive guide to the new story card design system
- Usage examples and integration patterns
- Benefits of modular architecture over inline patterns

### `animation-status.md`
- Documents the decision to use CSS animations instead of Framer Motion
- Explains TypeScript/React 19 compatibility issues with Framer Motion

## Usage Examples

### Basic Story Display
```tsx
import StoryCard from './StoryCard';

{storyHistory.map((story, index) => (
  <StoryCard
    key={story.id}
    story={story}
    isFirst={index === 0}
    showActions={false}
  />
))}
```

### With Custom Theme
```tsx
<StoryCard
  story={story}
  theme="highlighted"
  showActions={true}
  onAction={(action, story) => handleStoryAction(action, story)}
/>
```

## Recently Added

### Story Card Design System
- ✅ **StoryCard component**: Extracted from inline patterns
- ✅ **storyUtils.ts**: Centralized formatting utilities  
- ✅ **Design tokens**: Consistent styling system
- ✅ **Theme variants**: `default`, `highlighted`, `archived`
- ✅ **Accessibility**: ARIA labels and semantic HTML
- ✅ **Documentation**: Complete architecture guide

## Recently Cleaned Up

Removed duplicate files that were superseded by the CSS animated version:
- ~~`SimpleLiveFeed.tsx`~~ - Basic version without animations
- ~~`SimpleLiveFeedAnimated.tsx`~~ - Framer Motion version (incompatible)
- ~~Inline story card rendering~~ - Extracted to `StoryCard` component

