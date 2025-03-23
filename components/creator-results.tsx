import { getCreatorInfluence } from "@/lib/influence-analyzer"
import type { InfluenceScore } from "@/lib/types"
import InfluenceScoreCard from "./influence-score-card"
import InfluenceMetrics from "./influence-metrics"
import InfluenceDetails from "./influence-details"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { getStoredCreatorInfluence } from "@/lib/db-service"
import { extractChannelIdFromUrl } from "@/lib/utils"

export default async function CreatorResults({ query }: { query: string }) {
  try {
    // First try to get the channel ID
    const channelId = await extractChannelIdFromUrl(query)

    if (!channelId) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Unable to identify a YouTube channel from the provided URL. Please check the URL and try again.
          </AlertDescription>
        </Alert>
      )
    }

    // Try to get cached data first
    let influenceData = await getStoredCreatorInfluence(channelId)

    // If no cached data or it's stale, analyze the channel
    if (!influenceData || !isDataFresh(influenceData.updatedAt)) {
      try {
        influenceData = await getCreatorInfluence(query)
      } catch (error) {
        console.error("Error analyzing channel:", error)

        // If we have stale data, use it as fallback
        if (influenceData) {
          return (
            <>
              <Alert variant="warning" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Using cached data</AlertTitle>
                <AlertDescription>
                  We couldn't refresh the analysis due to API limits. Showing the last available data from{" "}
                  {new Date(influenceData.updatedAt).toLocaleDateString()}.
                </AlertDescription>
              </Alert>

              <CreatorResultsContent influenceData={influenceData} />
            </>
          )
        }

        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>API Limit Reached</AlertTitle>
            <AlertDescription>We've reached the API rate limit. Please try again later.</AlertDescription>
          </Alert>
        )
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
        )
      }
    }

    return <CreatorResultsContent influenceData={influenceData} />
  } catch (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "An error occurred while analyzing the creator."}
        </AlertDescription>
      </Alert>
    )
  }
}

function CreatorResultsContent({ influenceData }: { influenceData: InfluenceScore }) {
  // Check if content has low appropriateness score (potentially 18+ or harmful)
  const appropriatenessMetric = influenceData.metrics.find((m) => m.type === "appropriateness")
  const hasInappropriateContent = appropriatenessMetric && appropriatenessMetric.score < 50

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
  )
}

// Helper function to check if data is fresh (less than 24 hours old)
function isDataFresh(updatedAt: string): boolean {
  const lastUpdate = new Date(updatedAt).getTime()
  const now = new Date().getTime()
  const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60)

  return hoursDiff < 24
}

