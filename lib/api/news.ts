import axios from "axios"

export interface NewsArticle {
  title: string
  source: string
  url: string
  publishedAt: string
}

export async function getNewsArticles(query: string): Promise<NewsArticle[]> {
  try {
    // Clean up the query
    const searchQuery = query.replace(/\s+/g, " ").trim()

    // Use NewsAPI to search for articles
    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&sortBy=relevancy&language=en&pageSize=10&apiKey=${process.env.NEWS_API_KEY}`,
    )

    if (!response.data.articles || response.data.articles.length === 0) {
      return []
    }

    return response.data.articles.map((article: any) => ({
      title: article.title,
      source: article.source.name,
      url: article.url,
      publishedAt: article.publishedAt,
    }))
  } catch (error) {
    console.error("Error fetching news articles:", error)
    return []
  }
}

export function calculateNewsScore(articles: NewsArticle[]): number {
  if (articles.length === 0) {
    return 0
  }

  // Base score based on number of articles (max 50 points)
  const articleCountScore = Math.min(articles.length * 5, 50)

  // Recency score (max 30 points)
  let recencyScore = 0
  const now = new Date()
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(now.getMonth() - 1)

  const recentArticles = articles.filter((article) => {
    const publishDate = new Date(article.publishedAt)
    return publishDate >= oneMonthAgo
  })

  recencyScore = Math.round((recentArticles.length / articles.length) * 30)

  // Source diversity score (max 20 points)
  const uniqueSources = new Set(articles.map((article) => article.source)).size
  const diversityScore = Math.min(uniqueSources * 4, 20)

  return Math.min(articleCountScore + recencyScore + diversityScore, 100)
}

