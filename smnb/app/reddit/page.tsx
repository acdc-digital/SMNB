import RedditFeed from '@/components/RedditFeed';
import { fetchHotPosts } from '@/lib/reddit-actions';

export default async function RedditPage() {
  // Fetch initial hot posts from popular subreddits
  const initialData = await fetchHotPosts('popular', 10);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Reddit Feed Aggregator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover hot, rising, and trending posts from Reddit. Search across subreddits 
            or mix content from multiple communities to stay up to date with the latest discussions.
          </p>
        </div>

        <div className="mb-8 grid md:grid-cols-3 gap-4 text-center">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl mb-2">🔥</div>
            <h3 className="font-semibold text-lg mb-2">Hot Posts</h3>
            <p className="text-sm text-gray-600">
              Currently popular and actively discussed posts
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl mb-2">📈</div>
            <h3 className="font-semibold text-lg mb-2">Rising Posts</h3>
            <p className="text-sm text-gray-600">
              Posts gaining momentum and climbing the ranks
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl mb-2">⭐</div>
            <h3 className="font-semibold text-lg mb-2">Trending Posts</h3>
            <p className="text-sm text-gray-600">
              Top posts from the last hour - fresh and viral content
            </p>
          </div>
        </div>

        <RedditFeed initialPosts={initialData.error ? [] : initialData.posts} />
        
        {initialData.error && (
          <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <strong>Note:</strong> Initial data couldn&apos;t be loaded ({initialData.error}), 
            but you can still use the controls above to fetch Reddit posts.
          </div>
        )}
      </div>
    </div>
  );
}
