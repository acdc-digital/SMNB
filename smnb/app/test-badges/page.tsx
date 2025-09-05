/**
 * Story Thread Badges Test Page
 * 
 * Page for testing and demonstrating the story threading badge system
 */

'use client';

import React from 'react';
import StoryThreadBadgeDemo from '@/components/livefeed/StoryThreadBadgeDemo';

export default function TestBadgesPage() {
  return (
    <div className="min-h-screen bg-background">
      <StoryThreadBadgeDemo />
    </div>
  );
}