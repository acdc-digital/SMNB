import { redditAPI, RedditPost } from '@/lib/reddit-oauth';

export default async function RedditOAuthTestPage() {
  let posts: RedditPost[] = [];
  let error = null;
  const rateLimitInfo = redditAPI.getRateLimitInfo();

  try {
    const response = await redditAPI.fetchPosts('programming', 'hot', 5);
    posts = response.data.children.map(child => child.data);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reddit OAuth Implementation Test</h1>
      
      {/* Rate Limit Status */}
      <div className={`p-4 rounded mb-4 ${rateLimitInfo.authenticated ? 'bg-green-100 border border-green-400' : 'bg-yellow-100 border border-yellow-400'}`}>
        <h2 className="font-semibold mb-2">
          {rateLimitInfo.authenticated ? '🔐 OAuth Authenticated' : '⚠️ Anonymous Mode'}
        </h2>
        <p className="text-sm">
          <strong>Rate Limit:</strong> {rateLimitInfo.rateLimit}
        </p>
        {!rateLimitInfo.authenticated && (
          <p className="text-sm mt-2">
            💡 Add your Reddit app credentials to <code>.env.local</code> to enable OAuth and get 600/min!
          </p>
        )}
      </div>

      {/* API Response */}
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ Successfully fetched {posts.length} posts from r/programming
          {rateLimitInfo.authenticated ? ' using OAuth!' : ' using anonymous API.'}
        </div>
      )}

      {/* Posts Preview */}
      <div className="space-y-4">
        {posts.map((post: RedditPost) => (
          <div key={post.id} className="border rounded p-4 bg-white">
            <h3 className="font-semibold line-clamp-2">{post.title}</h3>
            <div className="text-sm text-gray-500 mt-2 flex gap-4">
              <span>👤 u/{post.author}</span>
              <span>⬆️ {post.score}</span>
              <span>💬 {post.num_comments}</span>
              <span>📍 r/{post.subreddit}</span>
            </div>
            {post.selftext && (
              <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                {post.selftext.slice(0, 150)}...
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Setup Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded">
        <h2 className="font-semibold mb-2">🚀 OAuth Setup Instructions</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Go to <a href="https://www.reddit.com/prefs/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">reddit.com/prefs/apps</a></li>
          <li>Click &quot;Create App&quot; or &quot;Create Another App&quot;</li>
          <li>Fill out:
            <ul className="list-disc list-inside ml-4 mt-1">
              <li><strong>Name:</strong> SMNB Reddit Aggregator</li>
              <li><strong>App type:</strong> Script</li>
              <li><strong>Description:</strong> Content aggregation for development</li>
              <li><strong>About URL:</strong> http://localhost:8888</li>
              <li><strong>Redirect URI:</strong> http://localhost:8888 (required but not used)</li>
            </ul>
          </li>
          <li>Click &quot;Create app&quot;</li>
          <li>Copy the client ID (under the app name) and secret</li>
          <li>Update your <code>.env.local</code> file with the real values</li>
          <li>Restart your dev server to see 600/min rate limit in action!</li>
        </ol>
      </div>

      {/* Environment Variables Template */}
      <div className="mt-4 p-4 bg-gray-900 text-green-400 rounded font-mono text-xs">
        <div className="mb-2 text-gray-400"># Add these to your .env.local file:</div>
        <div>REDDIT_CLIENT_ID=your_client_id_here</div>
        <div>REDDIT_CLIENT_SECRET=your_client_secret_here</div>
        <div>REDDIT_USER_AGENT=SMNB-Reddit-Aggregator/1.0</div>
      </div>
    </div>
  );
}
