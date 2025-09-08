// CLAUDE API ROUTE
// /Users/matthewsimon/Projects/SMNB/smnb/app/api/claude/route.ts

/**
 * Claude API Route
 * 
 * Server-side API endpoint for Claude LLM requests
 * This keeps the API key secure and handles all Claude communication
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, prompt, options, apiKey } = body;

    // Use provided API key or fall back to environment variable
    const effectiveApiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    
    // Log which API key source is being used
    if (apiKey) {
      console.log('🔑 SERVER: Using client-provided API key:', apiKey.slice(0, 12) + '...');
    } else if (process.env.ANTHROPIC_API_KEY) {
      console.log('🔑 SERVER: Using environment API key:', process.env.ANTHROPIC_API_KEY.slice(0, 12) + '...');
    } else {
      console.log('❌ SERVER: No API key available');
    }
    
    if (!effectiveApiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured. Please provide an API key.' },
        { status: 500 }
      );
    }

    // Create Anthropic client with the effective API key
    const anthropic = new Anthropic({
      apiKey: effectiveApiKey,
    });

    if (action === 'generate') {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: options?.maxTokens || 200,
        temperature: options?.temperature || 0.7,
        system: options?.systemPrompt || 'You are a professional news broadcaster generating engaging narrations.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return NextResponse.json({
          success: true,
          text: content.text.trim()
        });
      } else {
        throw new Error('Unexpected response format from Claude');
      }

    } else if (action === 'stream') {
      // Create a streaming response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const response = await anthropic.messages.create({
              model: 'claude-3-5-haiku-20241022',
              max_tokens: options?.maxTokens || 200,
              temperature: options?.temperature || 0.7,
              system: options?.systemPrompt || 'You are a professional news broadcaster generating engaging narrations.',
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ],
              stream: true
            });

            for await (const chunk of response) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                const data = JSON.stringify({ 
                  type: 'chunk', 
                  text: chunk.delta.text 
                });
                controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
              } else if (chunk.type === 'message_stop') {
                const data = JSON.stringify({ 
                  type: 'complete' 
                });
                controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                break;
              }
            }
          } catch (error) {
            const errorData = JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });

    } else if (action === 'analyze') {
      const analysisPrompt = `
Analyze the following social media content and provide a JSON response:

Content: "${prompt}"

Please analyze and return a JSON object with:
- sentiment: "positive" | "negative" | "neutral"
- topics: array of up to 3 relevant topics from: Technology, Politics, Economy, Health, Environment, Sports, Entertainment, Science, Business, Education, or General News
- summary: brief one-sentence summary (max 80 characters)
- urgency: "low" | "medium" | "high" based on language and content
- relevance: number between 0 and 1 indicating how newsworthy this is

Return only valid JSON, no additional text.
      `.trim();

      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 150,
        temperature: 0.3,
        system: 'You are a content analysis assistant. Always respond with valid JSON only.',
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        try {
          const analysis = JSON.parse(content.text.trim());
          return NextResponse.json({
            success: true,
            analysis
          });
        } catch (parseError) {
          console.error('Failed to parse Claude analysis:', parseError);
          return NextResponse.json(
            { error: 'Invalid JSON response from Claude' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Unexpected response format from Claude' },
        { status: 500 }
      );

    } else if (action === 'count-tokens') {
      // Token counting endpoint
      const { model, system, messages, tools, thinking } = body;
      
      const countRequest: any = {
        model: model || 'claude-3-5-haiku-20241022',
        messages: messages || []
      };
      
      if (system) countRequest.system = system;
      if (tools) countRequest.tools = tools;
      if (thinking) countRequest.thinking = thinking;

      const response = await anthropic.messages.countTokens(countRequest);
      
      return NextResponse.json({
        input_tokens: response.input_tokens
      });

    } else if (action === 'test') {
      // Simple connection test
      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Say "Connection successful" if you can read this.'
          }
        ]
      });

      const content = response.content[0];
      const success = content.type === 'text' && 
                     content.text.toLowerCase().includes('connection successful');

      return NextResponse.json({
        success,
        message: success ? 'Connection test passed' : 'Connection test unclear'
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Claude API error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
      if (error.message.includes('rate')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
