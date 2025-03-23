"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import SearchForm from "@/components/search-form";
import CreatorResults from "@/components/creator-results";

export default function AnalyzePage() {
  const searchParams = useSearchParams();
  const query = searchParams ? searchParams.get("query") || "" : "";
  const [isClient, setIsClient] = useState(false);

  // This effect ensures hydration is complete before rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Creator Analyzer</h1>
        <div className="w-full max-w-2xl mx-auto mb-8">
          <SearchForm initialQuery={query} isAnalyzePage={true} />
        </div>

        {query && isClient ? (
          <div className="mt-8">
            <CreatorResults query={query} />
          </div>
        ) : (
          !query && (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <h2 className="text-xl font-medium mb-3">Enter a YouTube Creator Name</h2>
              <p className="text-muted-foreground">
                Search for any YouTube creator to analyze their influence, credibility, and audience engagement.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}