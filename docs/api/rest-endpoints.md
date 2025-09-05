# REST API Endpoints

> **Next.js API Routes** - External service integration and data fetching

SMNB's REST API provides endpoints for Reddit content fetching, Claude AI analysis, and debugging utilities. All endpoints follow RESTful conventions with comprehensive error handling.

## 📍 Base URL

**Development**: `http://localhost:8888/api`  
**Production**: `https://your-domain.com/api`

## 🔑 Authentication

Most endpoints require API keys configured in environment variables:
- `REDDIT_CLIENT_ID` & `REDDIT_CLIENT_SECRET` - Reddit API access
- `ANTHROPIC_API_KEY` - Claude AI integration

See [Authentication Guide](./authentication.md) for setup details.

---

## 🟢 Reddit API Endpoints

### GET `/api/reddit`

Fetch posts from a single subreddit with optional search functionality.

**Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `subreddit` | string | No | `'all'` | Target subreddit name |
| `sort` | string | No | `'hot'` | Sort method: `hot`, `new`, `rising`, `top` |
| `limit` | number | No | `10` | Number of posts (max 25) |
| `q` | string | No | - | Search query within subreddit |
| `t` | string | No | `'day'` | Time filter for search: `hour`, `day`, `week`, `month`, `year`, `all` |

**Example Request**:
```bash
curl "http://localhost:8888/api/reddit?subreddit=worldnews&sort=hot&limit=5"
```

**Example Response**:
```json
{
  "success": true,
  "posts": [
    {
      "id": "1abc234",
      "title": "Breaking: Major World Event",
      "author": "newsuser",
      "subreddit": "worldnews",
      "url": "https://example.com/article",
      "permalink": "/r/worldnews/comments/1abc234/breaking_major_world_event/",
      "score": 1250,
      "num_comments": 89,
      "created_utc": 1703875200,
      "thumbnail": "https://b.thumbs.redditmedia.com/...",
      "selftext": "Article text content...",
      "is_video": false,
      "domain": "example.com",
      "upvote_ratio": 0.95,
      "over_18": false
    }
  ],
  "count": 5,
  "subreddit": "worldnews",
  "sort": "hot"
}
```

**Search Example**:
```bash
curl "http://localhost:8888/api/reddit?q=artificial%20intelligence&subreddit=technology&sort=top&t=week&limit=3"
```

### POST `/api/reddit`

Batch fetch posts from multiple subreddits simultaneously.

**Request Body**:
```json
{
  "subreddits": ["worldnews", "technology", "science"],
  "sort": "hot",
  "limit": 5
}
```

**Example Request**:
```bash
curl -X POST "http://localhost:8888/api/reddit" \
  -H "Content-Type: application/json" \
  -d '{
    "subreddits": ["worldnews", "technology"],
    "sort": "hot",
    "limit": 3
  }'
```

**Example Response**:
```json
{
  "success": true,
  "results": [
    {
      "subreddit": "worldnews",
      "posts": [...],
      "count": 3
    },
    {
      "subreddit": "technology", 
      "posts": [...],
      "count": 3
    }
  ],
  "failed": [],
  "totalPosts": 6
}
```

### GET `/api/reddit/duplicates`

Find duplicate submissions of a URL across Reddit.

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | URL to check for duplicates |

**Example Request**:
```bash
curl "http://localhost:8888/api/reddit/duplicates?url=https://example.com/article"
```

**Example Response**:
```json
{
  "success": true,
  "duplicates": [
    {
      "id": "abc123",
      "subreddit": "worldnews",
      "title": "Article Title",
      "score": 450,
      "num_comments": 23,
      "created_utc": 1703875200
    }
  ],
  "metrics": {
    "totalSubmissions": 3,
    "totalScore": 1250,
    "averageScore": 416.67,
    "topSubreddits": ["worldnews", "news", "politics"],
    "scoreDistribution": {
      "high": 1,
      "medium": 1, 
      "low": 1
    }
  }
}
```

---

## 🧠 Claude AI Endpoints

### POST `/api/claude`

Multi-purpose Claude AI integration with different action types.

**Request Body Structure**:
```json
{
  "action": "generate|stream|analyze|test|count-tokens",
  "prompt": "Content to process",
  "model": "claude-3-5-haiku-20241022",
  "system": "Optional system prompt",
  "max_tokens": 150,
  "temperature": 0.3
}
```

#### Action: `generate`

Generate text completion with Claude AI.

**Example Request**:
```bash
curl -X POST "http://localhost:8888/api/claude" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate",
    "prompt": "Write a news summary about AI developments",
    "max_tokens": 200,
    "temperature": 0.7
  }'
```

**Example Response**:
```json
{
  "success": true,
  "content": "Recent AI developments show significant progress...",
  "usage": {
    "input_tokens": 12,
    "output_tokens": 45,
    "total_tokens": 57
  }
}
```

#### Action: `stream`

Get streaming response from Claude AI (Server-Sent Events).

**Example Request**:
```bash
curl -X POST "http://localhost:8888/api/claude" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "stream",
    "prompt": "Explain quantum computing"
  }'
```

**Response Headers**:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Stream Events**:
```
data: {"type":"start","message":"Starting generation..."}

data: {"type":"content","text":"Quantum computing"}

data: {"type":"content","text":" is a revolutionary"}

data: {"type":"complete","usage":{"input_tokens":5,"output_tokens":25}}
```

#### Action: `analyze`

Analyze content for sentiment, topics, and metadata.

**Example Request**:
```bash
curl -X POST "http://localhost:8888/api/claude" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "prompt": "Breaking: Stock market hits new record high amid economic uncertainty"
  }'
```

**Example Response**:
```json
{
  "success": true,
  "analysis": {
    "sentiment": "neutral",
    "topics": ["Economy", "Business"],
    "summary": "Stock market reaches record despite economic uncertainty",
    "urgency": "medium",
    "relevance": 0.85
  }
}
```

#### Action: `count-tokens`

Count tokens for prompt optimization.

**Example Request**:
```bash
curl -X POST "http://localhost:8888/api/claude" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "count-tokens",
    "model": "claude-3-5-haiku-20241022",
    "messages": [{"role": "user", "content": "Hello world"}]
  }'
```

**Example Response**:
```json
{
  "input_tokens": 8
}
```

#### Action: `test`

Test Claude API connectivity.

**Example Request**:
```bash
curl -X POST "http://localhost:8888/api/claude" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test",
    "prompt": "test"
  }'
```

**Example Response**:
```json
{
  "success": true,
  "message": "Claude API is working correctly",
  "model": "claude-3-5-haiku-20241022",
  "timestamp": "2024-12-19T10:30:00Z"
}
```

---

## 🔧 Debug Endpoints

### GET `/api/claude/debug`

Get Claude API configuration status.

**Example Request**:
```bash
curl "http://localhost:8888/api/claude/debug"
```

**Example Response**:
```json
{
  "status": "debug",
  "environment": {
    "hasAnthropicKey": true,
    "keyLength": 108,
    "keyPrefix": "sk-ant-a...",
    "nodeEnv": "development",
    "timestamp": "2024-12-19T10:30:00Z"
  },
  "message": "Claude API key is configured"
}
```

### POST `/api/claude/debug`

Test Claude API connection end-to-end.

**Example Request**:
```bash
curl -X POST "http://localhost:8888/api/claude/debug"
```

**Example Response**:
```json
{
  "success": true,
  "result": {
    "success": true,
    "message": "Claude API is working correctly"
  },
  "message": "Claude API test successful"
}
```

---

## ⚠️ Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required parameter: subreddit",
  "code": "MISSING_PARAMETER"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid API key",
  "code": "INVALID_API_KEY"
}
```

#### 403 Forbidden (Reddit API blocked)
```json
{
  "success": false,
  "error": "Reddit API access blocked. Try again later.",
  "blocked": true,
  "posts": []
}
```

#### 429 Rate Limited
```json
{
  "success": false,
  "error": "Reddit API rate limit reached. Please wait before making more requests.",
  "rateLimited": true,
  "retryAfter": 60
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

#### 503 Service Unavailable (Circuit Breaker)
```json
{
  "success": false,
  "error": "Reddit API is temporarily unavailable due to rate limits. Please try again later.",
  "circuitBreakerOpen": true
}
```

## 🎯 Best Practices

### Rate Limiting
- Reddit API: 60 requests/minute for authenticated requests
- Claude API: Varies by model and subscription tier
- Implement exponential backoff for failed requests
- Use circuit breaker pattern for external API failures

### Caching
```typescript
// Cache Reddit responses for 5 minutes
const cacheKey = `reddit:${subreddit}:${sort}:${limit}`;
const cachedResponse = await cache.get(cacheKey);
if (cachedResponse) return cachedResponse;

const response = await redditAPI.fetchPosts(subreddit, sort, limit);
await cache.set(cacheKey, response, 300); // 5 minutes
```

### Error Recovery
```typescript
// Retry with exponential backoff
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(Math.pow(2, attempt) * 1000); // 2s, 4s, 8s
    }
  }
}
```

## 📊 Monitoring

### Health Checks
```bash
# Check API health
curl "http://localhost:8888/api/claude/debug"

# Test Reddit connectivity  
curl "http://localhost:8888/api/reddit?subreddit=test&limit=1"
```

### Metrics Tracking
- Response times per endpoint
- Error rates by error type
- Rate limit hit frequency
- Token usage for Claude API

---

*For more information, see [Error Handling Guide](./error-handling.md) and [Rate Limits Documentation](./rate-limits.md)*