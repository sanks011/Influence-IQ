import axios from "axios"

interface WikipediaPageInfo {
  exists: boolean
  title?: string
  extract?: string
  pageId?: number
  lastModified?: string
  pageViews?: number
  quality?: "high" | "medium" | "low"
}

export async function checkWikipediaPresence(query: string): Promise<boolean> {
  try {
    const pageInfo = await getWikipediaPageInfo(query)
    return pageInfo.exists
  } catch (error) {
    console.error("Error checking Wikipedia presence:", error)
    return false
  }
}

export async function getWikipediaPageInfo(query: string): Promise<WikipediaPageInfo> {
  try {
    // Clean up the query for Wikipedia search
    const searchQuery = query.replace(/\s+/g, " ").trim()

    // First, search for the query
    const searchResponse = await axios.get(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`,
    )

    if (!searchResponse.data.query.search || searchResponse.data.query.search.length === 0) {
      return { exists: false }
    }

    // Check if there's an exact match or very close match
    const topResult = searchResponse.data.query.search[0]
    const title = topResult.title.toLowerCase()
    const queryLower = searchQuery.toLowerCase()

    // Check if the title contains the query or vice versa
    if (title.includes(queryLower) || queryLower.includes(title)) {
      // Verify the page exists and is not a disambiguation page
      const pageResponse = await axios.get(
        `https://en.wikipedia.org/w/api.php?action=query&prop=info|extracts&exintro=1&titles=${encodeURIComponent(topResult.title)}&format=json&origin=*`,
      )

      const pages = pageResponse.data.query.pages
      const pageId = Object.keys(pages)[0]

      // If page ID is negative, it doesn't exist
      if (Number.parseInt(pageId) < 0) {
        return { exists: false }
      }

      const page = pages[pageId]

      // Check if it's a disambiguation page
      const contentResponse = await axios.get(
        `https://en.wikipedia.org/w/api.php?action=parse&pageid=${pageId}&prop=categories&format=json&origin=*`,
      )

      if (contentResponse.data.parse && contentResponse.data.parse.categories) {
        const isDisambiguation = contentResponse.data.parse.categories.some((category: any) =>
          category["*"].includes("Disambiguation"),
        )

        if (isDisambiguation) {
          return { exists: false }
        }
      }

      // Get page views for quality assessment
      const today = new Date()
      const lastMonth = new Date(today)
      lastMonth.setMonth(today.getMonth() - 1)

      let pageViews = 0;
      let quality: "high" | "medium" | "low" = "low";

      try {
        // Use the legacy pageview API
        const pageTitle = encodeURIComponent((page.title || topResult.title).replace(/ /g, "_"));
        
        const pageViewsResponse = await axios.get(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${pageTitle}&prop=pageviews&format=json&origin=*`
        );
        
        const pages = pageViewsResponse.data.query.pages;
        const pageData = pages[Object.keys(pages)[0]];
        
        if (pageData && pageData.pageviews) {
          // Sum up pageviews from the last month
          const views = Object.values(pageData.pageviews) as number[];
          pageViews = views.reduce((sum: number, views: number) => sum + (views || 0), 0);
        }
      } catch (pageViewsError) {
        console.error("Error fetching Wikipedia page views:", pageViewsError);
        // Fallback quality assessment based on extract length
        const extractLength = page.extract?.length || 0;
        if (extractLength > 5000) {
          quality = "high";
        } else if (extractLength > 1000) {
          quality = "medium";
        }
      }

      // Determine quality if we have pageViews
      if (pageViews > 0) {
        if (pageViews > 10000) {
          quality = "high";
        } else if (pageViews > 1000) {
          quality = "medium";
        }
      }

      return {
        exists: true,
        title: topResult.title,
        extract: page.extract,
        pageId: Number.parseInt(pageId),
        lastModified: page.touched,
        pageViews,
        quality,
      }
    }

    return { exists: false }
  } catch (error) {
    console.error("Error checking Wikipedia presence:", error)
    return { exists: false }
  }
}

