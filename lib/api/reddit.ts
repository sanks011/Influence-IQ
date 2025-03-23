import axios from "axios"

export interface RedditPost {
  title: string
  subreddit: string
  score: number
  commentCount: number
  url: string
}

export async function getRedditEngagement(query: string): Promise<RedditPost[]> {
  try {
    // Clean up the query
    const searchQuery = query.replace(/\s+/g, " ").trim()

    // Use Reddit's JSON API instead of Pushshift (which has been unreliable)
    // This approach uses Reddit's search functionality directly
    const response = await axios.get(
      `https://www.reddit.com/search.json?q=${encodeURIComponent(searchQuery)}&sort=relevance&t=all&limit=25`,
      {
        headers: {
          "User-Agent": "InfluenceIQ/1.0",
        },
      },
    )

    if (!response.data.data || !response.data.data.children || response.data.data.children.length === 0) {
      // Fallback to a different endpoint if the first one fails
      try {
        const fallbackResponse = await axios.get(
          `https://www.reddit.com/search.json?q=${encodeURIComponent(searchQuery)}&sort=top&t=all&limit=25`,
          {
            headers: {
              "User-Agent": "InfluenceIQ/1.0",
            },
          },
        )

        if (
          !fallbackResponse.data.data ||
          !fallbackResponse.data.data.children ||
          fallbackResponse.data.data.children.length === 0
        ) {
          return []
        }

        return fallbackResponse.data.data.children.map((child: any) => ({
          title: child.data.title,
          subreddit: `r/${child.data.subreddit}`,
          score: child.data.score || 0,
          commentCount: child.data.num_comments || 0,
          url: `https://reddit.com${child.data.permalink}`,
        }))
      } catch (fallbackError) {
        console.error("Error fetching Reddit engagement (fallback):", fallbackError)
        return []
      }
    }

    return response.data.data.children.map((child: any) => ({
      title: child.data.title,
      subreddit: `r/${child.data.subreddit}`,
      score: child.data.score || 0,
      commentCount: child.data.num_comments || 0,
      url: `https://reddit.com${child.data.permalink}`,
    }))
  } catch (error) {
    console.error("Error fetching Reddit engagement:", error)

    // If we get CORS issues, try a proxy approach
    try {
      // Use a CORS proxy service
      const proxyUrl = "https://corsproxy.io/?"
      const targetUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&limit=25`

      const proxyResponse = await axios.get(proxyUrl + encodeURIComponent(targetUrl), {
        headers: {
          "User-Agent": "InfluenceIQ/1.0",
        },
      })

      if (proxyResponse.data.data && proxyResponse.data.data.children && proxyResponse.data.data.children.length > 0) {
        return proxyResponse.data.data.children.map((child: any) => ({
          title: child.data.title,
          subreddit: `r/${child.data.subreddit}`,
          score: child.data.score || 0,
          commentCount: child.data.num_comments || 0,
          url: `https://reddit.com${child.data.permalink}`,
        }))
      }
    } catch (proxyError) {
      console.error("Error fetching Reddit engagement via proxy:", proxyError)
    }

    return []
  }
}

export function calculateRedditScore(posts: RedditPost[]): number {
  if (posts.length === 0) {
    return 0
  }

  // Base score based on number of posts (max 30 points)
  const postCountScore = Math.min(posts.length * 1.5, 30)

  // Engagement score based on upvotes and comments (max 50 points)
  let totalUpvotes = 0
  let totalComments = 0

  posts.forEach((post) => {
    totalUpvotes += post.score
    totalComments += post.commentCount
  })

  // Scale the engagement scores logarithmically but with increased sensitivity
  const upvoteScore = Math.min(Math.log10(totalUpvotes + 1) * 12, 30)
  const commentScore = Math.min(Math.log10(totalComments + 1) * 12, 30)

  // Subreddit diversity score (max 20 points)
  const uniqueSubreddits = new Set(posts.map((post) => post.subreddit)).size
  const diversityScore = Math.min(uniqueSubreddits * 2.5, 20)

  return Math.min(postCountScore + upvoteScore + commentScore + diversityScore, 100)
}

