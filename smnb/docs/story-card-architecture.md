# Story Card Design Architecture

## Overview

The story card design system has been refactored from inline styling patterns to a modular, reusable component architecture. This documentation outlines the new design patterns and how to use them.

## Architecture Components

### 1. **StoryCard Component**
**Location**: `/components/livefeed/StoryCard.tsx`

A dedicated, reusable React component for displaying story cards with consistent styling and behavior.

```tsx
<StoryCard
  story={story}
  isFirst={index === 0}
  theme="highlighted" // 'default' | 'highlighted' | 'archived'
  showActions={true}
  onAction={(action, story) => handleAction(action, story)}
/>
```

**Features**:
- ✅ **Consistent visual design** across all story displays
- ✅ **Accessibility support** with ARIA labels and semantic HTML
- ✅ **Theme variants** for different contexts
- ✅ **Responsive layout** with proper mobile support
- ✅ **TypeScript interfaces** for type safety

### 2. **Design System Utilities**
**Location**: `/lib/utils/storyUtils.ts`

Centralized utilities for consistent story metadata formatting and styling.

#### **StoryDisplayUtils**
- `getToneEmoji()` - Emoji representations for story tones
- `getPriorityEmoji()` - Emoji representations for priorities  
- `formatTime()` - Relative time formatting (e.g., "2h ago")
- `getReadingTime()` - Duration formatting (e.g., "3m read")
- `getSentimentColor()` - Tailwind classes for sentiment indicators

#### **StoryCardTokens**
Design system tokens for consistent styling:
```tsx
// Base card styles
base: "border rounded-lg p-3 space-y-2 bg-card text-card-foreground transition-all duration-200 hover:shadow-md"

// Card states  
highlighted: "border-blue-500 bg-blue-500/5 shadow-sm ring-1 ring-blue-500/20"
normal: "border-border/50 hover:border-border hover:bg-card/50"

// Layout sections
header: "flex items-center gap-2 flex-wrap"
content: "text-sm text-card-foreground line-clamp-3 leading-relaxed"
metadata: "flex justify-between items-center text-xs text-muted-foreground gap-2"
```

#### **StoryThemes**
Pre-defined theme combinations:
- **`default`**: Standard card appearance
- **`highlighted`**: First story with blue accent
- **`archived`**: Muted appearance for older stories

### 3. **Accessibility (A11y) Support**
**Location**: `StoryA11y` in `storyUtils.ts`

- Screen reader labels for story cards
- Semantic HTML structure
- Keyboard navigation support
- High contrast color schemes

## Design Patterns

### **Color System**
Uses semantic CSS variables from the theme system:
```css
--card: Card background color
--card-foreground: Card text color  
--border: Border colors
--muted-foreground: Secondary text
```

### **Typography Scale**
- **Story content**: `text-sm` (14px) with relaxed line height
- **Metadata**: `text-xs` (12px) for secondary information
- **Labels**: `text-xs` with uppercase and tracking for tone/priority

### **Visual Hierarchy**
1. **Emojis** for quick visual identification (tone + priority)
2. **Story content** as primary focus with readable typography
3. **Metadata** as secondary information with muted colors
4. **Thread indicators** with color-coded badges

### **Interaction States**
- **Hover**: Subtle shadow and border color changes
- **Focus**: Ring outline for keyboard navigation
- **First story**: Blue accent border and background tint

## Usage Examples

### **Basic Story Display**
```tsx
import StoryCard from '@/components/livefeed/StoryCard';

function StoryList({ stories }) {
  return (
    <div className="space-y-3">
      {stories.map((story, index) => (
        <StoryCard
          key={story.id}
          story={story}
          isFirst={index === 0}
        />
      ))}
    </div>
  );
}
```

### **With Actions**
```tsx
<StoryCard
  story={story}
  showActions={true}
  onAction={(action, story) => {
    switch (action) {
      case 'read': openFullStory(story);
      case 'share': shareStory(story);
      case 'bookmark': bookmarkStory(story);
    }
  }}
/>
```

### **Custom Theme**
```tsx
<StoryCard
  story={story}
  theme="archived"
  className="opacity-75"
/>
```

## Benefits of New Architecture

### **Before (Inline Patterns)**
❌ **Mixed concerns**: Styling logic in render function  
❌ **Code duplication**: Same formatting logic repeated  
❌ **Hard to maintain**: Changes require updates in multiple places  
❌ **No reusability**: Can't use story cards in other components  
❌ **Inconsistent styling**: Manual color/spacing decisions

### **After (Component Architecture)**  
✅ **Separation of concerns**: Styling in utilities, logic in component  
✅ **DRY principle**: Single source of truth for formatting  
✅ **Easy maintenance**: Changes in one place affect all usages  
✅ **Reusable**: Can use StoryCard in multiple contexts  
✅ **Design system**: Consistent tokens and theming

## Integration Guide

### **Updating Existing Components**
1. Import `StoryCard` component
2. Import utilities if needed for custom formatting
3. Replace inline story rendering with `<StoryCard />`
4. Remove old formatting functions

### **Creating New Story Displays**
1. Use `StoryCard` as base component
2. Apply custom `className` for specific styling needs
3. Use `theme` prop for different contexts
4. Leverage `StoryDisplayUtils` for consistent formatting

## Design System Expansion

The new architecture allows for easy expansion:

### **New Themes**
Add themes to `StoryThemes` in `storyUtils.ts`:
```tsx
export const StoryThemes = {
  // ... existing themes
  urgent: {
    card: "border-red-500 bg-red-500/10 animate-pulse",
    content: "text-red-900 dark:text-red-100"
  }
} as const;
```

### **New Metadata Types**
Extend `StoryDisplayUtils` with new formatting functions:
```tsx
export const StoryDisplayUtils = {
  // ... existing utils
  getAuthorBadge: (author: string): string => {
    // Custom author formatting
  }
};
```

### **New Visual Indicators**
Add to `StoryCardTokens`:
```tsx
export const StoryCardTokens = {
  // ... existing tokens
  urgentBadge: "px-2 py-1 bg-red-500 text-white rounded-full animate-pulse"
} as const;
```

This architecture provides a solid foundation for maintaining and expanding the story card design system while ensuring consistency and reusability across the application.