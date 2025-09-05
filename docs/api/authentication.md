# Authentication & Security

> **API Security** - Authentication, authorization, and security best practices

SMNB uses API key-based authentication for external services and implements security best practices for data protection and access control.

## 🔐 Authentication Overview

SMNB integrates with multiple external services requiring different authentication methods:

```mermaid
graph LR
    subgraph "SMNB Application"
        API[API Routes]
        Convex[Convex Backend]
        Client[React Client]
    end
    
    subgraph "External Services"
        Reddit[Reddit API<br/>OAuth2]
        Claude[Claude AI<br/>API Key]
        OpenAI[OpenAI<br/>API Key]
    end
    
    subgraph "Authentication Layer"
        ENV[Environment Variables]
        Headers[Request Headers]
        Middleware[Auth Middleware]
    end
    
    Client --> API
    API --> Middleware
    Middleware --> ENV
    Middleware --> Headers
    Headers --> Reddit
    Headers --> Claude
    Headers --> OpenAI
    API --> Convex
```

## 🔑 API Key Configuration

### Environment Variables

Create a `.env.local` file in your project root:

```bash
# Reddit API Credentials
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=YourApp/1.0.0 (by /u/yourusername)

# Claude AI
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI (Optional)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx

# Convex
CONVEX_DEPLOYMENT=your_convex_deployment_name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Application Settings
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:8888
```

### Security Best Practices

```typescript
// ✅ Good - Server-side only
// pages/api/reddit/route.ts
const redditClient = new RedditAPI({
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  userAgent: process.env.REDDIT_USER_AGENT
});

// ❌ Bad - Never expose API keys to client
const badApiKey = process.env.ANTHROPIC_API_KEY; // Would be exposed to browser
```

## 🌐 Reddit API Authentication

### OAuth2 Setup

SMNB uses Reddit's OAuth2 flow for authenticated API access:

#### 1. **Create Reddit Application**

1. Go to [Reddit App Preferences](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Fill out the form:
   - **Name**: Your application name
   - **App type**: "web app" 
   - **Description**: Brief description of your app
   - **About URL**: Your app's homepage
   - **Redirect URI**: `http://localhost:8888/auth/reddit/callback`

#### 2. **Configure Credentials**

```bash
# From Reddit app settings
REDDIT_CLIENT_ID=14_character_string
REDDIT_CLIENT_SECRET=27_character_string
REDDIT_USER_AGENT=YourAppName/1.0.0 (by /u/yourusername)
```

#### 3. **Implementation Example**

```typescript
// lib/reddit/client.ts
import { RedditApi } from 'reddit-ts';

export class RedditClient {
  private client: RedditApi;
  
  constructor() {
    this.client = new RedditApi({
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
      userAgent: process.env.REDDIT_USER_AGENT!,
    });
  }
  
  async authenticate() {
    try {
      const auth = await this.client.auth.clientCredentials();
      console.log('✅ Reddit authentication successful');
      return auth;
    } catch (error) {
      console.error('❌ Reddit authentication failed:', error);
      throw new Error('Reddit API authentication failed');
    }
  }
  
  async fetchSubreddit(subreddit: string, sort: string = 'hot') {
    await this.authenticate();
    return this.client.subreddit(subreddit)[sort]();
  }
}
```

### Rate Limiting & Headers

Reddit requires specific headers for API access:

```typescript
const headers = {
  'User-Agent': process.env.REDDIT_USER_AGENT,
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};

// Example API call
const response = await fetch(`https://oauth.reddit.com/r/${subreddit}/hot`, {
  headers,
  method: 'GET'
});
```

## 🧠 Claude AI Authentication

### API Key Setup

Claude uses simple API key authentication:

#### 1. **Get API Key**

1. Sign up at [Anthropic Console](https://console.anthropic.com)
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (starts with `sk-ant-`)

#### 2. **Implementation**

```typescript
// app/api/claude/route.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Server-side only
});

export async function POST(request: NextRequest) {
  try {
    // Verify API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured' },
        { status: 500 }
      );
    }
    
    const { prompt, action } = await request.json();
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }]
    });
    
    return NextResponse.json({ success: true, response });
  } catch (error) {
    // Handle authentication errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid Claude API key' },
        { status: 401 }
      );
    }
    
    throw error;
  }
}
```

### Token Management

Track usage to manage costs:

```typescript
// Track token usage for billing
const trackTokenUsage = async (usage: TokenUsage) => {
  await recordTokenUsage({
    request_id: `req_${Date.now()}`,
    timestamp: Date.now(),
    model: 'claude-3-5-haiku-20241022',
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    total_tokens: usage.input_tokens + usage.output_tokens,
    estimated_cost: calculateCost(usage),
    request_type: 'api_call',
    success: true
  });
};
```

## 🔒 Convex Authentication

### Setup & Configuration

Convex handles authentication automatically with proper setup:

#### 1. **Convex Project Setup**

```bash
# Initialize Convex
npx convex dev

# Deploy schema
npx convex deploy
```

#### 2. **Environment Configuration**

```bash
# Convex provides these automatically
CONVEX_DEPLOYMENT=your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

#### 3. **Client Setup**

```typescript
// app/ConvexClientProvider.tsx
"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
```

### Function-Level Security

Implement access control in Convex functions:

```typescript
// convex/posts.ts
export const createPost = mutation({
  args: { title: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    // Check user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Authentication required");
    }
    
    // Check user permissions
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", q => q.eq("token", identity.token))
      .first();
      
    if (!user || user.role !== "admin") {
      throw new ConvexError("Insufficient permissions");
    }
    
    return await ctx.db.insert("posts", {
      ...args,
      userId: user._id,
      createdAt: Date.now()
    });
  }
});
```

## 🛡️ Security Best Practices

### 1. **Environment Variable Security**

```typescript
// ✅ Good - Validate environment variables at startup
const requiredEnvVars = [
  'REDDIT_CLIENT_ID',
  'REDDIT_CLIENT_SECRET', 
  'ANTHROPIC_API_KEY',
  'CONVEX_DEPLOYMENT'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

### 2. **API Key Rotation**

```typescript
// Implement API key rotation strategy
const API_KEY_ROTATION_DAYS = 90;

const checkApiKeyAge = (keyCreatedAt: number) => {
  const ageInDays = (Date.now() - keyCreatedAt) / (1000 * 60 * 60 * 24);
  
  if (ageInDays > API_KEY_ROTATION_DAYS) {
    console.warn('⚠️ API key is older than 90 days, consider rotation');
  }
};
```

### 3. **Request Validation**

```typescript
// Validate and sanitize all inputs
import { z } from 'zod';

const redditRequestSchema = z.object({
  subreddit: z.string().regex(/^[a-zA-Z0-9_]+$/).max(21),
  sort: z.enum(['hot', 'new', 'rising', 'top']),
  limit: z.number().int().min(1).max(100),
  q: z.string().optional()
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  try {
    const params = redditRequestSchema.parse({
      subreddit: searchParams.get('subreddit') || 'all',
      sort: searchParams.get('sort') || 'hot',
      limit: parseInt(searchParams.get('limit') || '10'),
      q: searchParams.get('q')
    });
    
    // Safe to proceed with validated params
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );
  }
}
```

### 4. **Rate Limiting Protection**

```typescript
// Implement client-side rate limiting
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  canMakeRequest(apiKey: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const requests = this.requests.get(apiKey) || [];
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(apiKey, recentRequests);
    return true;
  }
}

const rateLimiter = new RateLimiter();

// Usage in API route
const canProceed = rateLimiter.canMakeRequest(
  'reddit_api',
  60, // 60 requests
  60 * 1000 // per minute
);

if (!canProceed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  );
}
```

### 5. **Error Handling Security**

```typescript
// Don't expose sensitive information in errors
export async function POST(request: NextRequest) {
  try {
    const response = await anthropic.messages.create(messageParams);
    return NextResponse.json({ success: true, response });
  } catch (error) {
    // Log detailed error server-side
    console.error('Anthropic API error:', error);
    
    // Return generic error to client
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
    
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    // Generic error for unexpected issues
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 🔍 Testing Authentication

### Reddit API Test

```bash
# Test Reddit API connectivity
curl -X GET "http://localhost:8888/api/reddit?subreddit=test&limit=1" \
  -H "Accept: application/json"
```

### Claude API Test

```bash
# Test Claude API
curl -X POST "http://localhost:8888/api/claude" \
  -H "Content-Type: application/json" \
  -d '{"action": "test", "prompt": "Hello"}'
```

### Debug Endpoints

```bash
# Check Claude API configuration
curl "http://localhost:8888/api/claude/debug"

# Test Claude connection end-to-end
curl -X POST "http://localhost:8888/api/claude/debug"
```

## 📊 Monitoring & Logging

### Authentication Events

```typescript
// Log authentication events for monitoring
const logAuthEvent = async (event: AuthEvent) => {
  await recordTokenUsage({
    request_id: `auth_${Date.now()}`,
    timestamp: Date.now(),
    model: 'authentication',
    action: event.type, // 'success', 'failure', 'refresh'
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    estimated_cost: 0,
    request_type: 'auth',
    success: event.success,
    error_message: event.error,
    metadata: JSON.stringify(event.metadata)
  });
};

// Usage
await logAuthEvent({
  type: 'reddit_auth',
  success: true,
  metadata: { subreddit: 'worldnews' }
});
```

### Health Checks

```typescript
// API health monitoring
export async function GET() {
  const health = {
    reddit: await testRedditConnection(),
    claude: await testClaudeConnection(),
    convex: await testConvexConnection(),
    timestamp: new Date().toISOString()
  };
  
  const allHealthy = Object.values(health).every(status => 
    typeof status === 'boolean' ? status : true
  );
  
  return NextResponse.json(health, { 
    status: allHealthy ? 200 : 503 
  });
}
```

## 🚨 Security Checklist

- [ ] **API Keys**: All keys stored in environment variables
- [ ] **Validation**: All inputs validated and sanitized  
- [ ] **Rate Limiting**: Client-side rate limiting implemented
- [ ] **Error Handling**: No sensitive data exposed in errors
- [ ] **Logging**: Authentication events logged for monitoring
- [ ] **Rotation**: API key rotation strategy in place
- [ ] **Testing**: Authentication tests automated
- [ ] **Monitoring**: Health checks and alerting configured
- [ ] **Documentation**: Security practices documented for team

---

## 🔗 Related Resources

- **[Reddit API Documentation](https://www.reddit.com/dev/api/oauth)**
- **[Anthropic API Reference](https://docs.anthropic.com/en/api/getting-started)**
- **[Convex Authentication](https://docs.convex.dev/auth)**
- **[Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)**

---

*For implementation examples, see [Examples & Tutorials](./examples.md)*  
*For error handling patterns, see [Error Handling Guide](./error-handling.md)*