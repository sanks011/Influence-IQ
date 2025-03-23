import { NextResponse } from "next/server"
import { getTopCreators } from "@/lib/db-service"
import { getCreatorInfluence } from "@/lib/influence-analyzer"

// This endpoint will be called by Vercel Cron to refresh our cache
export async function GET() {
  try {
    // Get top 5 creators to refresh
    const topCreators = await getTopCreators(5)

    if (!topCreators || topCreators.length === 0) {
      return NextResponse.json({ message: "No creators to refresh" })
    }

    // Refresh each creator's data
    const refreshPromises = topCreators.map(async (creator) => {
      try {
        const channelUrl = `https://youtube.com/channel/${creator.channelId}`
        await getCreatorInfluence(channelUrl)
        return { channelId: creator.channelId, status: "refreshed" }
      } catch (error) {
        console.error(`Error refreshing creator ${creator.channelId}:`, error)
        return { channelId: creator.channelId, status: "error" }
      }
    })

    const results = await Promise.allSettled(refreshPromises)

    return NextResponse.json({
      message: "Cache refresh completed",
      results: results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value
        } else {
          return { channelId: topCreators[index].channelId, status: "error", error: result.reason }
        }
      }),
    })
  } catch (error) {
    console.error("Error in refresh-cache API:", error)
    return NextResponse.json({ error: "Failed to refresh cache" }, { status: 500 })
  }
}

