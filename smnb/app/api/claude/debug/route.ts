// CLAUDE API DEBUG ROUTE
// /Users/matthewsimon/Projects/SMNB/smnb/app/api/claude/debug/route.ts

/**
 * Claude API Debug Route
 * 
 * Simple endpoint to test Claude API configuration
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const envStatus = {
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    keyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
    keyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 8) + '...' || 'not set',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json({
    status: 'debug',
    environment: envStatus,
    message: envStatus.hasAnthropicKey 
      ? 'Claude API key is configured' 
      : 'Claude API key is missing - add ANTHROPIC_API_KEY to .env.local'
  });
}

export async function POST() {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'ANTHROPIC_API_KEY not configured',
        instructions: 'Add your Claude API key to .env.local file'
      }, { status: 500 });
    }

    // Test basic connection
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test',
        prompt: 'test'
      })
    });

    const result = await response.json();

    return NextResponse.json({
      success: response.ok,
      result,
      message: response.ok ? 'Claude API test successful' : 'Claude API test failed'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test Claude API connection'
    }, { status: 500 });
  }
}