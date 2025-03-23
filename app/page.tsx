"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ContainerScroll } from "@/components/ui/container-scroll";
import SearchForm from "@/components/search-form";
import CreatorResults from "@/components/creator-results";
import { useState, useEffect } from "react";
import { ArrowLeft, Search, TrendingUp, BarChart3 } from "lucide-react";

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
      <div className="text-center mb-10">
        <div className="flex items-center justify-center mb-5">
          <div className="bg-black p-3 rounded-full">
            <TrendingUp className="h-7 w-7 text-white" />
          </div>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4 text-black">InfluenceIQ</h1>
        <p className="text-lg sm:text-xl text-muted-foreground">
          Discover and analyze YouTube creators based on credibility, influence, and engagement metrics
        </p>
      </div>
    </div>
  );

  // If there's a query, show the results instead of the homepage content
  if (query && isClient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="group flex items-center text-primary hover:text-primary/80 mb-6 inline-block transition-colors">
            <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-[-4px] transition-transform" />
            <span className="font-medium">Back to Home</span>
          </Link>
          
          <div className="bg-background/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-border/50">
            <h1 className="text-3xl font-bold mb-6 text-black">Creator Analysis</h1>
            
            <div className="w-full max-w-2xl mx-auto mb-8">
              <SearchForm initialQuery={query} />
            </div>
            
            <div className="mt-8">
              <CreatorResults query={query} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular homepage display when there's no query
  return (
    <ContainerScroll titleComponent={TitleComponent}>
      <div className="h-full flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl mx-auto mb-12 relative">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="text-center mb-6">
              <Search className="h-7 w-7 mx-auto mb-3 text-black" />
              <h2 className="text-2xl font-bold mb-2">Quick Analysis</h2>
              <p className="text-muted-foreground mb-4">
                Enter a YouTube channel URL or creator name to get insights
              </p>
            </div>
            <SearchForm />
          </div>
        </div>
        
        <div className="text-center max-w-3xl">
          <h2 className="text-3xl font-bold mb-4 text-black">
            Discover Top YouTube Influencers
          </h2>
          <p className="text-muted-foreground mb-8">
            Find and analyze the most influential creators across different categories
          </p>
          
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {[
              { name: "MrBeast", url: "https://www.youtube.com/@MrBeast" },
              { name: "Marques Brownlee", url: "https://www.youtube.com/@mkbhd" },
              { name: "Veritasium", url: "https://www.youtube.com/@veritasium" },
              { name: "Linus Tech Tips", url: "https://www.youtube.com/@LinusTechTips" }
            ].map((creator, index) => (
              <Link
                key={index}
                href={`/?query=${encodeURIComponent(creator.url)}`}
                className="px-5 py-3 bg-white border border-gray-200 hover:border-gray-400 rounded-full text-sm font-medium transition-all hover:shadow-md flex items-center gap-2"
              >
                <svg className="h-4 w-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {creator.name}
              </Link>
            ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            <Link
              href="/top-creators"
              className="group px-6 py-4 bg-black text-white rounded-xl text-lg font-medium transition-all hover:shadow-lg hover:bg-gray-900"
            >
              <div className="flex items-center justify-center gap-3">
                <TrendingUp className="h-5 w-5" />
                <span>Browse Top Creators</span>
              </div>
            </Link>
            
            <Link
              href="/dashboard"
              className="group px-6 py-4 bg-white border border-gray-200 hover:border-gray-400 rounded-xl text-lg font-medium transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-center gap-3">
                <BarChart3 className="h-5 w-5 text-black" />
                <span>View Dashboard</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </ContainerScroll>
  );
}