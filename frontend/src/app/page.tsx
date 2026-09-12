import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center space-y-8">
      <h1 className="text-5xl font-semibold tracking-tight">
        Discover intelligence in property.
      </h1>
      <p className="text-xl text-secondary max-w-2xl">
        Explore curated listings, insightful analytics, and premium projects in Pune.
      </p>
      <div className="flex gap-4">
        <Link 
          href="/explore"
          className="px-6 py-3 bg-foreground text-background rounded-lg hover:bg-opacity-90 transition"
        >
          Explore Listings
        </Link>
        <Link 
          href="/insights"
          className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-border/50 transition"
        >
          View Insights
        </Link>
      </div>
    </div>
  );
}
