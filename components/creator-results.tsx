"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import InfluenceScoreCard from "./influence-score-card";
import InfluenceMetrics from "./influence-metrics";
import InfluenceDetails from "./influence-details";
import type { InfluenceScore } from "@/lib/types";

export default function CreatorResults({ query }: { query: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [influenceData, setInfluenceData] = useState<InfluenceScore | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Make a POST request to your existing API endpoint
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: query }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze channel');
        }
        
        const data = await response.json();
        setInfluenceData(data);
        
        // Notify the search form that results are loaded
        window.dispatchEvent(new Event('resultsLoaded'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error("Error analyzing channel:", err);
      } finally {
        setLoading(false);
      }
    }

    if (query) {
      fetchData();
    }
  }, [query]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <span className="text-lg text-center">Analyzing creator influence...</span>
        <p className="text-sm text-muted-foreground text-center mt-2">
          This may take a moment as we gather data from multiple sources.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!influenceData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Unable to analyze this YouTube channel. Please check the URL and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return <CreatorResultsContent influenceData={influenceData} />;
}

function CreatorResultsContent({ influenceData }: { influenceData: InfluenceScore }) {
  // Check if content has low appropriateness score (potentially 18+ or harmful)
  const appropriatenessMetric = influenceData.metrics.find((m) => m.type === "appropriateness");
  const hasInappropriateContent = appropriatenessMetric && appropriatenessMetric.score < 50;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3">
          <InfluenceScoreCard
            score={influenceData.overallScore}
            channelTitle={influenceData.channelTitle}
            channelThumbnail={influenceData.channelThumbnail}
            subscriberCount={influenceData.subscriberCount}
            hasInappropriateContent={hasInappropriateContent}
          />
        </div>
        <div className="lg:w-2/3">
          <InfluenceMetrics metrics={influenceData.metrics} />
        </div>
      </div>

      <InfluenceDetails influenceData={influenceData} />
    </div>
  );
}
// Helper function to check if data is fresh (less than 24 hours old)
function isDataFresh(updatedAt: string): boolean {
  const lastUpdate = new Date(updatedAt).getTime()
  const now = new Date().getTime()
  const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60)

  return hoursDiff < 24
}

