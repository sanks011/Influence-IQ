import { NextResponse } from "next/server"
import { getCreatorInfluence } from "@/lib/influence-analyzer"
import { saveCreatorInfluence, getCreatorInfluence as getStoredCreatorInfluence } from "@/lib/db-service"
import { extractChannelIdFromUrl } from "@/lib/utils"

// Set cache control headers
export const revalidate = 3600 // Revalidate at most every hour

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Extract channel ID from URL
    const channelId = await extractChannelIdFromUrl(url)
    if (!channelId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL or unable to retrieve channel information" },
        { status: 400 },
      )
    }

    // Check if we already have data for this channel
    const storedData = await getStoredCreatorInfluence(channelId)

    // If data exists and is less than 24 hours old, return it
    if (storedData && isDataFresh(storedData.updatedAt)) {
      console.log(`Using cached data for channel ${channelId}`)
      return NextResponse.json(storedData)
    }

    // Otherwise, analyze the channel and store the results
    console.log(`Analyzing channel ${channelId}`)
    const influenceData = await getCreatorInfluence(url)

    if (!influenceData) {
      return NextResponse.json({ error: "Could not analyze this YouTube channel" }, { status: 404 })
    }

    // Save the data to Firestore
    await saveCreatorInfluence(influenceData)

    return NextResponse.json(influenceData)
  } catch (error) {
    console.error("Error in analyze API:", error)

    // Handle rate limit errors specifically
    if (error instanceof Error && error.message.includes("quota")) {
      return NextResponse.json({ error: "API rate limit exceeded. Please try again later." }, { status: 429 })
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "An error occurred" }, { status: 500 })
  }
}

// Helper function to check if data is fresh (less than 24 hours old)
function isDataFresh(updatedAt: string): boolean {
  const lastUpdate = new Date(updatedAt).getTime()
  const now = new Date().getTime()
  const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60)

  return hoursDiff < 24
}

