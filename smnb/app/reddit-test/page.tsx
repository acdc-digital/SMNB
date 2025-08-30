import { redditAPI, RedditPost } from '@/lib/reddit';

export default async function RedditTestPage() {
  let posts: RedditPost[] = [];
  let error = null;

  try {
    const response = await redditAPI.fetchPosts('programming', 'hot', 5);
    posts = response.data.children.map(child => child.data);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reddit API Test (No Auth Required)</h1>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ Successfully fetched {posts.length} posts from r/programming without authentication!
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post: RedditPost) => (
          <div key={post.id} className="border rounded p-4">
            <h3 className="font-semibold">{post.title}</h3>
            <div className="text-sm text-gray-500 mt-2">
              👤 u/{post.author} | ⬆️ {post.score} | 💬 {post.num_comments} comments
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">How this works:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Using Reddit&apos;s public JSON API: <code>reddit.com/r/subreddit/hot.json</code></li>
          <li>No API keys or authentication required</li>
          <li>Just need a proper User-Agent header</li>
          <li>Rate limited by IP, but generous for read-only access</li>
        </ul>
      </div>
    </div>
  );
}
