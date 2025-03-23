export interface SearchParamsType {
  query?: string
}

export interface InfluenceMetric {
  type: string
  label: string
  score: number
  description: string
}

export interface GeminiMetric {
  score: number
  description: string
}

export interface GeminiAnalysis {
  audienceSentiment: GeminiMetric
  contentQuality: GeminiMetric
  credibility: GeminiMetric
  relevance: GeminiMetric
  appropriateness: GeminiMetric
  engagement: GeminiMetric
  analysis: string
  recommendations: string[]
}

export interface InfluenceScore {
  channelId: string
  channelTitle: string
  channelDescription: string
  channelThumbnail: string
  subscriberCount: string
  overallScore: number
  metrics: InfluenceMetric[]
  geminiAnalysis: GeminiAnalysis
  updatedAt: string
}

