import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { getYouTubeChannelInfo } from "./api/youtube"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function extractChannelIdFromUrl(url: string): Promise<string | null> {
  try {
    const channelInfo = await getYouTubeChannelInfo(url)
    return channelInfo?.id || null
  } catch (error) {
    console.error("Error extracting channel ID:", error)
    return null
  }
}
