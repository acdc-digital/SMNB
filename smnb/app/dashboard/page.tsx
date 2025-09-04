// DASHBOARD PAGE
// /Users/matthewsimon/Projects/SMNB/smnb/app/dashboard/page.tsx

'use client';

import React from "react";
import FeedSidebar from "./feed/FeedSidebar";
import Studio from "./studio/Studio";

export default function DashboardPage() {
  return (
    <>
      {/* Feed Sidebar */}
      <FeedSidebar />
      
      {/* Studio */}
      <Studio />
    </>
  );
}
