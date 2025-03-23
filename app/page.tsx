"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ContainerScroll } from "@/components/ui/container-scroll";
import SearchForm from "@/components/search-form";
import CreatorResults from "@/components/creator-results";
import { useState, useEffect } from "react";

export default function HomePage() {
  const searchParams = useSearchParams();
  const query = searchParams ? searchParams.get("query") || "" : "";
  const [isClient, setIsClient] = useState(false);
  
  // This effect ensures hydration is complete before rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  const TitleComponent = (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-3">InfluenceIQ</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Analyze YouTube creators based on credibility, influence, and engagement
        </p>
      </div>
    </div>
  );

  // If there's a query, show the results instead of the homepage content
  if (query && isClient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-primary hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold mb-6">Creator Analysis</h1>
          <div className="w-full max-w-2xl mx-auto mb-8">
            <SearchForm initialQuery={query} />
          </div>
          <div className="mt-8">
            <CreatorResults query={query} />
          </div>
        </div>
      </div>
    );
  }

  // Regular homepage display when there's no query
  return (
    <ContainerScroll titleComponent={TitleComponent}>
      <div className="h-full flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl mx-auto mb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Quick Analysis</h2>
            <p className="text-muted-foreground mt-2 mb-4">
              Enter a channel URL or creator name to get started
            </p>
          </div>
          <SearchForm />
        </div>
        
        <div className="text-center max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">Discover Top YouTube Influencers</h2>
          <p className="text-muted-foreground mb-8">
            Find and analyze influential creators across different categories
          </p>
          
            <div className="flex flex-wrap gap-4 justify-center mb-12">
            <Link
              href={`/?query=${encodeURIComponent('https://www.youtube.com/@MrBeast')}`}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-full text-sm font-medium transition-colors"
            >
              MrBeast
            </Link>
            <Link
              href={`/?query=${encodeURIComponent('https://www.youtube.com/@mkbhd')}`}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-full text-sm font-medium transition-colors"
            >
              Marques Brownlee
            </Link>
            <Link
              href={`/?query=${encodeURIComponent('https://www.youtube.com/@veritasium')}`}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-full text-sm font-medium transition-colors"
            >
              Veritasium
            </Link>
            <Link
              href={`/?query=${encodeURIComponent('https://www.youtube.com/@LinusTechTips')}`}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-full text-sm font-medium transition-colors"
            >
              Linus Tech Tips
            </Link>
            </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/top-creators"
              className="px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-base font-medium transition-colors"
            >
              Browse Top Creators
            </Link>
            
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-primary/10 hover:bg-primary/20 rounded-md text-base font-medium transition-colors"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </ContainerScroll>
  );
}