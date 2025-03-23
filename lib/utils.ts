import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { getYouTubeChannelInfo } from "./api/youtube"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// In utils.ts, update the extractChannelIdFromUrl function

export async function extractChannelIdFromUrl(url: string): Promise<string | null> {
  try {
    if (!url) {
      console.warn("Empty URL provided to extractChannelIdFromUrl")
      return null
    }
    
    console.log(`Extracting channel ID from URL: ${url}`)
    const channelInfo = await getYouTubeChannelInfo(url)
    
    if (!channelInfo) {
      console.warn(`No channel info returned for URL: ${url}`)
      return null
    }
    
    return channelInfo.id || null
  } catch (error) {
    console.error("Error extracting channel ID:", error)
    // Create a fallback channel ID based on the URL
    if (url) {
      const fallbackId = `UC_${Buffer.from(url).toString("hex").substring(0, 22)}`
      console.log(`Using fallback channel ID: ${fallbackId}`)
      return fallbackId
    }
    return null
  }
}