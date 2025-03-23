import axios from "axios"
import type { NewsArticle } from "./news"
import type { RedditPost } from "./reddit"

interface GeminiAnalysisResult {
  overallScore: number
  metrics: {
    audienceSentiment: {
      score: number
      description: string
    }
    contentQuality: {
      score: number
      description: string
    }
    credibility: {
      score: number
      description: string
    }
    relevance: {
      score: number
      description: string
    }
    appropriateness: {
      score: number
      description: string
    }
    engagement: {
      score: number
      description: string
    }
  }
  analysis: string
  recommendations: string[]
}

interface ChannelData {
  channelTitle: string
  channelDescription: string
  subscriberCount: number
  videoCount: number
  viewCount: number
  comments: string[]
  hasWikipedia: boolean
  newsArticles: NewsArticle[]
  redditPosts: RedditPost[]
  sentimentAnalysis: {
    positive: number
    negative: number
    neutral: number
  }
}

export async function analyzeWithGemini(channelData: ChannelData): Promise<GeminiAnalysisResult> {
  try {
    const API_KEY = process.env.GEMINI_API_KEY

    if (!API_KEY) {
      console.warn("Gemini API key not found, using fallback analysis")
      return generateFallbackAnalysis(channelData)
    }

    // Prepare the prompt for Gemini with comprehensive data
    const prompt = `
      You are an expert YouTube creator analyst with extremely high standards. Analyze this YouTube creator based on the following comprehensive data and provide detailed metrics with high sensitivity to differentiate quality.
      
      CHANNEL INFORMATION:
      Channel Name: ${channelData.channelTitle}
      Channel Description: ${channelData.channelDescription}
      Subscriber Count: ${channelData.subscriberCount.toLocaleString()}
      Video Count: ${channelData.videoCount}
      Total View Count: ${channelData.viewCount.toLocaleString()}
      
      CREDIBILITY INDICATORS:
      Has Wikipedia Page: ${channelData.hasWikipedia ? "Yes" : "No"}
      News Articles Found: ${channelData.newsArticles.length}
      ${channelData.newsArticles.length > 0 ? "Sample News Headlines:" : ""}
      ${channelData.newsArticles
      .slice(0, 5)
      .map((article) => `- "${article.title}" (${article.source})`)
      .join("\n")}
      
      AUDIENCE ENGAGEMENT:
      Reddit Posts Found: ${channelData.redditPosts.length}
      ${channelData.redditPosts.length > 0 ? "Sample Reddit Discussions:" : ""}
      ${channelData.redditPosts
      .slice(0, 5)
      .map((post) => `- "${post.title}" (${post.subreddit}, Score: ${post.score}, Comments: ${post.commentCount})`)
      .join("\n")}
      
      AUDIENCE SENTIMENT:
      Positive Comments: ${channelData.sentimentAnalysis.positive.toFixed(1)}%
      Negative Comments: ${channelData.sentimentAnalysis.negative.toFixed(1)}%
      Neutral Comments: ${channelData.sentimentAnalysis.neutral.toFixed(1)}%
      
      EDUCATION AND INAPPROPRIATE CONTENT ANALYSIS:
      Educational Terms Found: ${channelData.comments.join(' ').toLowerCase().match(/(learn|educational|informative|taught|study|knowledge|science|math|physics|chemistry|biology|history|literature|academic|research|professor|teacher|lecture|curriculum|education|university|college|school|classroom|student|scholar|learning|teaching|tutor|lesson|course|workshop|training|expert|phd|master|degree|artificial intelligence|machine learning|deep learning|neural network|ai|quantum computing|quantum mechanics|quantum physics|robotics|data science|computer science|algorithm|programming|coding|software|hardware|technology|engineering|mathematics|statistics|probability|calculus|algebra|geometry|theoretical physics|astrophysics|astronomy|aerospace|cybersecurity|blockchain|cryptography|bioinformatics|neuroscience|cognitive science|psychology|linguistics|philosophy|logic|reasoning|critical thinking)/g)?.length || 0}
      Inappropriate Terms Found: ${channelData.comments.join(' ').toLowerCase().match(/(vulgar|inappropriate|adult|nsfw|offensive|explicit|porn|sex|fuck|shit|dick|ass|bitch|gandu|bhenchod|chutiya|madarchod|bhosdike|randi|aashiq|lawda|lund|chut|bahinchod|bc|mc|gaali|ashleel|nangi|sexy|nanga|suicide|abuse|rape|harassment|violence|hate|racist|discrimination|kamina|harami|bewakoof|pagal|buddhu|ullu|chutiyo|kutta|kutti|saala|sali|maderchod|behenchod|bakrichod|kutiya|thopu|dhakkan|gadha|bakland|chodu|chutmarike|jhatu|chutad|bhadwa|bhosda|chinaal|chudai|bkl|mkc|tmkc|bsdk|betichod|maachod|lavde|jhaat|hijra|chakka|randwa|bhosadike|gaandu|lodu|lauda|chudna|chudwana|raand|bawasir|tattu|choot|dalla|rand|randi|gashti|jaahil|gandmasti|kuttiya|kutti|paagal|chutiye|chodu|laudu|gadhe|andh|bevda|bevdi|chus|chusna|muth|gandu|gaand|jhaant)/g)?.length || 0}
      
      SAMPLE COMMENTS (${Math.min(channelData.comments.length, 15)} of ${channelData.comments.length}):
      ${channelData.comments
      .slice(0, 15)
      .map((comment) => `- "${comment}"`)
      .join("\n")}
      
      ANALYSIS INSTRUCTIONS:
      1. Analyze all the data above with extreme sensitivity:
       - Educational terms found should significantly boost scores (+5 points per term, up to +50)
       - Each inappropriate term should heavily penalize scores (-10 points per term)
      2. Be objective and data-driven in your analysis.
      3. CRITICAL: Base content quality assessment on:
       - Wikipedia presence (-40 points if absent)
       - Educational term frequency (major positive factor)
       - Inappropriate term frequency (major negative factor)
      4. Award significant bonus points for:
       - High educational term count (+20 points to content quality)
       - Academic/scientific terms (+15 points to content quality)
       - Educational partnerships (+15 points to credibility)
      5. Apply major penalties for:
       - Each instance of inappropriate language (-10 points to appropriateness)
       - Adult content references (-20 points per instance)
       - Harmful content (-30 points to overall score per instance)
      6. Consider the ratio of educational to inappropriate terms in final scoring.
      7. Provide specific recommendations based on term analysis.
      
      RESPONSE FORMAT:
      {
      "overallScore": number (0-100),
      "metrics": {
      "audienceSentiment": {
      "score": number (0-100),
      "description": "detailed explanation including term analysis"
      },
      "contentQuality": {
      "score": number (0-100),
      "description": "detailed explanation with educational vs inappropriate term impact"
      },
      "credibility": {
      "score": number (0-100),
      "description": "detailed explanation"
      },
      "relevance": {
      "score": number (0-100),
      "description": "detailed explanation"
      },
      "appropriateness": {
      "score": number (0-100),
      "description": "detailed explanation with inappropriate term analysis"
      },
      "engagement": {
      "score": number (0-100)",
      "description": "detailed explanation"
      }
      },
      "analysis": "2-3 paragraph overall analysis including term frequency impact",
      "recommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4"]
      }
      
      Ensure your JSON is valid and properly formatted.
    `

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      },
    )

    // Extract the text response from Gemini
    const textResponse = response.data.candidates[0].content.parts[0].text

    // Extract the JSON part from the response
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.warn("Failed to parse Gemini response as JSON, using fallback")
      return generateFallbackAnalysis(channelData)
    }

    try {
      const result = JSON.parse(jsonMatch[0]) as GeminiAnalysisResult

      // Validate and normalize scores
      result.overallScore = normalizeScore(result.overallScore)
      result.metrics.audienceSentiment.score = normalizeScore(result.metrics.audienceSentiment.score)

      // Ensure content quality is reduced by 40 if no Wikipedia page
      if (!channelData.hasWikipedia) {
        const originalScore = result.metrics.contentQuality.score
        result.metrics.contentQuality.score = Math.max(0, originalScore - 40)
        result.metrics.contentQuality.description = `Score reduced from ${originalScore} to ${result.metrics.contentQuality.score} due to lack of Wikipedia page. ${result.metrics.contentQuality.description}`
      } else {
        result.metrics.contentQuality.score = normalizeScore(result.metrics.contentQuality.score)
      }

      result.metrics.credibility.score = normalizeScore(result.metrics.credibility.score)
      result.metrics.relevance.score = normalizeScore(result.metrics.relevance.score)
      result.metrics.appropriateness.score = normalizeScore(result.metrics.appropriateness.score)
      result.metrics.engagement.score = normalizeScore(result.metrics.engagement.score)

      // Recalculate overall score to ensure it reflects the content quality reduction
      const avgScore =
        (result.metrics.audienceSentiment.score +
          result.metrics.contentQuality.score +
          result.metrics.credibility.score +
          result.metrics.relevance.score +
          result.metrics.appropriateness.score +
          result.metrics.engagement.score) /
        6

      // Adjust overall score with higher weight to content quality and credibility
      result.overallScore = Math.round(
        result.metrics.audienceSentiment.score * 0.15 +
          result.metrics.contentQuality.score * 0.25 +
          result.metrics.credibility.score * 0.25 +
          result.metrics.relevance.score * 0.15 +
          result.metrics.appropriateness.score * 0.1 +
          result.metrics.engagement.score * 0.1,
      )

      return result
    } catch (parseError) {
      console.error("Error parsing Gemini JSON response:", parseError)
      return generateFallbackAnalysis(channelData)
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    return generateFallbackAnalysis(channelData)
  }
}

// Helper function to normalize scores to 0-100 range
function normalizeScore(score: number): number {
  if (isNaN(score)) return 50
  return Math.max(0, Math.min(100, Math.round(score)))
}

// Generate fallback analysis when Gemini API fails
function generateFallbackAnalysis(channelData: ChannelData): GeminiAnalysisResult {
  // Check comments for educational value, inappropriate content, and vulgar language
  const comments = channelData.comments.join(' ').toLowerCase();
  const hasEducationalMentions = comments.match(/(learn|educational|informative|taught|study|knowledge|science|math|physics|chemistry|biology|history|literature|academic|research|professor|teacher|lecture|curriculum|education|university|college|school|classroom|student|scholar|learning|teaching|tutor|lesson|course|workshop|training|expert|phd|master|degree|artificial intelligence|machine learning|deep learning|neural network|ai|quantum computing|quantum mechanics|quantum physics|robotics|data science|computer science|algorithm|programming|coding|software|hardware|technology|engineering|mathematics|statistics|probability|calculus|algebra|geometry|theoretical physics|astrophysics|astronomy|aerospace|cybersecurity|blockchain|cryptography|bioinformatics|neuroscience|cognitive science|psychology|linguistics|philosophy|logic|reasoning|critical thinking)/g)?.length || 0;
  const hasInappropriateMentions = comments.match(/(vulgar|inappropriate|adult|nsfw|offensive|explicit|porn|sex|fuck|shit|dick|ass|bitch|gandu|bhenchod|chutiya|madarchod|bhosdike|randi|aashiq|lawda|lund|chut|bahinchod|bc|mc|gaali|ashleel|nangi|sexy|nanga|suicide|abuse|rape|harassment|violence|hate|racist|discrimination|kamina|harami|bewakoof|pagal|buddhu|ullu|chutiyo|kutta|kutti|saala|sali|maderchod|behenchod|bakrichod|kutiya|thopu|dhakkan|gadha|bakland|chodu|chutmarike|jhatu|chutad|bhadwa|bhosda|chinaal|chudai|bkl|mkc|tmkc|bsdk|betichod|maachod|lavde|jhaat|hijra|chakka|randwa|bhosadike|gaandu|lodu|lauda|chudna|chudwana|raand|bawasir|tattu|choot|dalla|rand|randi|gashti|jaahil|gandmasti|kuttiya|kutti|paagal|chutiye|chodu|laudu|gadhe|andh|bevda|bevdi|chus|chusna|muth|gandu|gaand|jhaant)/g)?.length || 0;

  // Calculate sentiment score with extreme sensitivity
  const sentimentScore = Math.round(
    60 + (channelData.sentimentAnalysis.positive - channelData.sentimentAnalysis.negative) * 1.5,
  );

  // Calculate content quality with extreme sensitivity
  let contentQualityScore = 85; // Higher base score for excellent creators
  
  if (!channelData.hasWikipedia) {
    contentQualityScore -= 40; // Mandatory reduction for no Wikipedia
  }

  // Add bonus points for educational indicators
  if (hasEducationalMentions >= 5) contentQualityScore += 50;
  
  // Add points for news coverage, especially academic partnerships
  const academicNews = channelData.newsArticles.filter(a => 
    a.title.toLowerCase().includes('university') || 
    a.title.toLowerCase().includes('education') ||
    a.title.toLowerCase().includes('research')
  ).length;
  contentQualityScore += Math.min(academicNews * 5, 15);

  // Calculate appropriateness score with penalties
  let appropriatenessScore = 90; // Start high
  if (hasInappropriateMentions > 0) {
    appropriatenessScore -= Math.min(hasInappropriateMentions * 30, 60);
  }

  // Calculate credibility score
  const hasWikipedia = channelData.hasWikipedia ? 70 : 20;
  const newsScore = Math.min(channelData.newsArticles.length * 8, 30);
  const credibilityScore = Math.min(hasWikipedia + newsScore, 100);

  // Calculate engagement with extreme sensitivity
  const redditEngagement = Math.min(channelData.redditPosts.reduce((sum, post) => sum + post.score, 0) / 100, 50);
  const commentEngagement = Math.min(channelData.comments.length, 50);
  const engagementScore = Math.round(redditEngagement + commentEngagement);

  // Calculate relevance score with focus on educational value
  let relevanceScore = channelData.hasWikipedia ? 70 : 30;
  relevanceScore += Math.min(academicNews * 10, 30);

  // Calculate overall score with extreme sensitivity
  let overallScore = Math.round(
    sentimentScore * 0.15 +
    contentQualityScore * 0.25 +
    credibilityScore * 0.25 +
    engagementScore * 0.1 +
    relevanceScore * 0.15 +
    appropriatenessScore * 0.1
  );

  // Apply harmful content penalty if detected
  if (hasInappropriateMentions > 5) {
    overallScore = Math.max(30, overallScore - 50);
  }

  return {
    overallScore,
    metrics: {
      audienceSentiment: {
        score: sentimentScore,
        description: `Extremely sensitive sentiment analysis shows ${channelData.sentimentAnalysis.positive.toFixed(1)}% positive engagement with ${hasEducationalMentions} educational value mentions.`
      },
      contentQuality: {
        score: contentQualityScore,
        description: `${channelData.hasWikipedia ? 'Wikipedia presence indicates notable content.' : 'Lack of Wikipedia presence (-40 points)'}. ${academicNews} academic/educational news mentions detected.`
      },
      credibility: {
        score: credibilityScore,
        description: `Credibility assessment based on ${channelData.hasWikipedia ? 'verified Wikipedia presence' : 'lack of Wikipedia presence'} and ${channelData.newsArticles.length} news mentions, including ${academicNews} academic references.`
      },
      relevance: {
        score: relevanceScore,
        description: `Relevance evaluated through educational impact, ${academicNews} academic mentions, and broader influence indicators.`
      },
      appropriateness: {
        score: appropriatenessScore,
        description: `Content appropriateness score reflects ${hasInappropriateMentions} inappropriate content mentions, with significant penalties applied where detected.`
      },
      engagement: {
        score: engagementScore,
        description: `Engagement measured through Reddit activity (${channelData.redditPosts.length} posts) and comment interaction patterns.`
      }
    },
    analysis: `${channelData.channelTitle} demonstrates ${overallScore >= 95 ? 'exceptional' : overallScore >= 70 ? 'solid' : overallScore >= 50 ? 'moderate' : 'concerning'} influence metrics, with particular emphasis on ${contentQualityScore > 80 ? 'content excellence' : 'areas needing improvement'}. ${channelData.hasWikipedia ? 'The established Wikipedia presence significantly boosts credibility' : 'The lack of Wikipedia presence severely impacts content quality assessment'}.

    Educational value and content appropriateness analysis reveals ${hasEducationalMentions} learning-related mentions and ${hasInappropriateMentions} concerning content flags. The channel has garnered ${academicNews} academic or educational news mentions, ${academicNews > 3 ? 'indicating strong educational credibility' : 'suggesting room for academic engagement'}.`,
    recommendations: [
      channelData.hasWikipedia ? 
        "Maintain Wikipedia presence while expanding academic partnerships" : 
        "Prioritize Wikipedia inclusion through notable, educational content creation",
      hasEducationalMentions > 5 ?
        "Leverage existing educational impact for institutional partnerships" :
        "Increase educational content focus with expert collaborations",
      hasInappropriateMentions > 0 ?
        "Address content appropriateness concerns in future content" :
        "Maintain high content standards while expanding reach",
      academicNews > 3 ?
        "Expand academic partnerships and educational initiatives" :
        "Develop relationships with educational institutions and experts"
    ]
  };
}

