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
      detectedKeywords?: {  // Added this field to store detected keywords
        severe: string[]
        moderate: string[]
        mild: string[]
      }
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

// Add this interface from the new code
interface InappropriateTermCounts {
  severe: number;
  moderate: number;
  mild: number;
}

// Add this interface to track detected keywords
interface DetectedInappropriateTerms {
  severe: string[];
  moderate: string[];
  mild: string[];
}

// Add the inappropriate terms map from the new code
const inappropriateTermsMap = {
  // Severe inappropriate content (highest penalty)
  severe: /(\bporn\b|\bxxx\b|obscene|x-rated|\bmasturbat\b|kill yourself|suicide instruction|racial slur|\bn[*-]word\b|antisemit|\bgore\b|\bहिंदी\b|\bपोर्न\b|\bसेक्स\b|\bनंगा\b|\bकामुक\b|\bभोजपुरी\b|\bबीपी\b|\bचुदाई\b|\bगंदा\b|\bसेक्सी\b|\bदेसी\b|\bbhojpuri hot\b|\bbhojpuri video\b|\bbhojpuri dance\b|\bbhojpuri song\b|\bbhojpuri film\b)/gi,

  // Moderate terms are less severe but still concerning
  moderate: /(\bexplicit adult\b|\bnude\b|\bnaked\b|\berotic\b|\bd[*i]ck\b|\bp[*u]ssy\b|\bc[*u]nt\b|\bslut\b|\bwhore\b|\bself harm\b|\bseductive\b|\bstriptease\b|\bhookup\b|\bkinky\b|\bsexual\b|\bundress\b|\bforeplay\b|\bintimate scene\b|\brapper\b|\bcomedian\b|\bvulgar\b)/gi,


  // Mild inappropriate content (lowest penalty)
  mild: /(\badult content\b|\b18\+\b|\bnsfw\b|\bswearing\b|\bcrude humor\b)/gi
};

export async function analyzeWithGemini(channelData: ChannelData): Promise<GeminiAnalysisResult> {
  try {
    const API_KEY = process.env.GEMINI_API_KEY

    if (!API_KEY) {
      console.warn("Gemini API key not found, using fallback analysis")
      return generateFallbackAnalysis(channelData)
    }

    // Get counts and detected terms of inappropriate terms by category for the prompt
    const [inappropriateTermCounts, detectedTerms] = countAndDetectInappropriateTerms(channelData.comments);
    const totalInappropriateTerms = 
      inappropriateTermCounts.severe + 
      inappropriateTermCounts.moderate + 
      inappropriateTermCounts.mild;

    // Simplify the Gemini prompt
    const prompt = `
      Analyze this YouTube creator based on the following data and provide metrics on a scale of 0-100:
      
      CHANNEL: ${channelData.channelTitle}
      DESCRIPTION: ${channelData.channelDescription}
      SUBSCRIBERS: ${channelData.subscriberCount.toLocaleString()}
      VIDEOS: ${channelData.videoCount}
      VIEWS: ${channelData.viewCount.toLocaleString()}
      
      CREDIBILITY: 
      - Wikipedia: ${channelData.hasWikipedia ? "Yes" : "No"}
      - News Articles: ${channelData.newsArticles.length}
      ${channelData.newsArticles.slice(0, 3).map(article => `  - "${article.title}"`).join("\n")}
      
      AUDIENCE ENGAGEMENT:
      - Reddit Posts: ${channelData.redditPosts.length}
      - Sentiment: ${channelData.sentimentAnalysis.positive.toFixed(1)}% positive, ${channelData.sentimentAnalysis.negative.toFixed(1)}% negative
      
      CONTENT ANALYSIS:
      - Educational Terms: ${countEducationalTerms(channelData.comments)}
      - Inappropriate Terms: ${totalInappropriateTerms} (${inappropriateTermCounts.severe} severe, ${inappropriateTermCounts.moderate} moderate, ${inappropriateTermCounts.mild} mild)
      
      SAMPLE COMMENTS (5 of ${channelData.comments.length}):
      ${channelData.comments.slice(0, 5).map(comment => `- "${comment}"`).join("\n")}
      
      Provide a valid JSON response with this exact structure:
      {
        "overallScore": number (0-100),
        "metrics": {
          "audienceSentiment": {"score": number, "description": "string"},
          "contentQuality": {"score": number, "description": "string"},
          "credibility": {"score": number, "description": "string"},
          "relevance": {"score": number, "description": "string"},
          "appropriateness": {"score": number, "description": "string"},
          "engagement": {"score": number, "description": "string"}
        },
        "analysis": "string",
        "recommendations": ["string", "string", "string", "string"]
      }
      
      IMPORTANT SCORING RULES:
      - No Wikipedia page reduces content quality by 40 points
      - Educational terms should increase content quality
      - Inappropriate terms should decrease appropriateness
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

    try {
      // First try to parse the entire response if it's already JSON
      const result = JSON.parse(textResponse) as GeminiAnalysisResult;
      return validateAndNormalizeScores(result, channelData, detectedTerms);
    } catch (error) {
      // If that fails, try to extract JSON using a more robust regex
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]) as GeminiAnalysisResult;
          return validateAndNormalizeScores(result, channelData, detectedTerms);
        } catch (parseError) {
          console.error("Error parsing extracted JSON:", parseError);
          return generateFallbackAnalysis(channelData);
        }
      } else {
        console.warn("No JSON found in Gemini response");
        return generateFallbackAnalysis(channelData);
      }
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    return generateFallbackAnalysis(channelData)
  }
}

// Updated function to validate and normalize scores with detected terms
function validateAndNormalizeScores(
  result: GeminiAnalysisResult, 
  channelData: ChannelData,
  detectedTerms: DetectedInappropriateTerms
): GeminiAnalysisResult {
  // Validate and normalize scores
  result.overallScore = normalizeScore(result.overallScore);
  result.metrics.audienceSentiment.score = normalizeScore(result.metrics.audienceSentiment.score);
  result.metrics.contentQuality.score = normalizeScore(result.metrics.contentQuality.score);
  result.metrics.credibility.score = normalizeScore(result.metrics.credibility.score);
  result.metrics.relevance.score = normalizeScore(result.metrics.relevance.score);
  result.metrics.appropriateness.score = normalizeScore(result.metrics.appropriateness.score);
  result.metrics.engagement.score = normalizeScore(result.metrics.engagement.score);
  
  // Apply Wikipedia penalty consistently
  if (!channelData.hasWikipedia) {
    const originalScore = result.metrics.contentQuality.score;
    result.metrics.contentQuality.score = Math.max(0, originalScore - 40);
    result.metrics.contentQuality.description = 
      `Score reduced from ${originalScore} to ${result.metrics.contentQuality.score} due to lack of Wikipedia page. ${result.metrics.contentQuality.description}`;
  }
  
  // Add detected inappropriate terms to the appropriateness metric
  result.metrics.appropriateness.detectedKeywords = {
    severe: detectedTerms.severe,
    moderate: detectedTerms.moderate,
    mild: detectedTerms.mild
  };
  
  // Recalculate overall score with weighted contributions
  result.overallScore = Math.round(
    result.metrics.audienceSentiment.score * 0.15 +
    result.metrics.contentQuality.score * 0.25 +
    result.metrics.credibility.score * 0.25 +
    result.metrics.relevance.score * 0.15 +
    result.metrics.appropriateness.score * 0.1 +
    result.metrics.engagement.score * 0.1
  );
  
  return result;
}

// Helper functions for term counting
function countEducationalTerms(comments: string[]): number {
  const educationalPattern = /(learn|educational|informative|taught|study|knowledge|science|math|physics|chemistry|biology|history|literature|academic|research|professor|teacher|lecture|curriculum|education|university|college|school|classroom|student|scholar|learning|teaching|tutor|lesson|course|workshop|training|expert|phd|master|degree|tech|geek|coding|programming|development|software|engineering|algorithm|database|computer|analytics|artificial intelligence|machine learning|data science|cybersecurity|networking|architecture|framework|methodology|innovation|technical|technology|movie|tech|geek)/gi;
  
  return comments.join(' ').match(educationalPattern)?.length || 0;
}

// New function that both counts and detects inappropriate terms
function countAndDetectInappropriateTerms(comments: string[]): [InappropriateTermCounts, DetectedInappropriateTerms] {
  // Store counts for each category
  let counts = {
    severe: 0,
    moderate: 0,
    mild: 0
  };
  
  // Store the detected terms
  let detectedTerms = {
    severe: [] as string[],
    moderate: [] as string[],
    mild: [] as string[]
  };
  
  // Excluded terms that were causing false positives
  const excludedContextPattern = /(\bcoding\b|\bprogramming\b|\btutorial\b|\btech\b|\blearning\b|\beducational\b|\bjavascript\b|\bhtml\b|\bcss\b|\bweb dev\b|\bsoftware\b|\breact\b|\bangular\b|\bnode\b|\bpython\b|music|label|official|channel)/i;
  
  for (const comment of comments) {
    // Skip comments in educational, tech context
    if (excludedContextPattern.test(comment)) {
      continue;
    }
    
    // Find and store detected terms for severe category
    let severeMatches = comment.match(inappropriateTermsMap.severe);
    if (severeMatches) {
      counts.severe += severeMatches.length;
      severeMatches.forEach(term => {
        if (!detectedTerms.severe.includes(term.toLowerCase())) {
          detectedTerms.severe.push(term.toLowerCase());
        }
      });
    }
    
    // Find and store detected terms for moderate category
    let moderateMatches = comment.match(inappropriateTermsMap.moderate);
    if (moderateMatches) {
      counts.moderate += moderateMatches.length;
      moderateMatches.forEach(term => {
        if (!detectedTerms.moderate.includes(term.toLowerCase())) {
          detectedTerms.moderate.push(term.toLowerCase());
        }
      });
    }
    
    // Find and store detected terms for mild category
    let mildMatches = comment.match(inappropriateTermsMap.mild);
    if (mildMatches) {
      counts.mild += mildMatches.length;
      mildMatches.forEach(term => {
        if (!detectedTerms.mild.includes(term.toLowerCase())) {
          detectedTerms.mild.push(term.toLowerCase());
        }
      });
    }
  }
  
  return [counts, detectedTerms];
}

// Old function kept for backward compatibility
function countInappropriateTerms(comments: string[]): InappropriateTermCounts {
  const [counts] = countAndDetectInappropriateTerms(comments);
  return counts;
}

// Helper function to normalize scores to 0-100 range
function normalizeScore(score: number): number {
  if (isNaN(score)) return 50
  return Math.max(0, Math.min(100, Math.round(score)))
}

// Updated generateFallbackAnalysis function to include detected keywords
function generateFallbackAnalysis(channelData: ChannelData): GeminiAnalysisResult {
  // Count educational and inappropriate terms
  const educationalTerms = countEducationalTerms(channelData.comments);
  const [inappropriateTerms, detectedTerms] = countAndDetectInappropriateTerms(channelData.comments);
  
  // Calculate content quality score
  let contentQualityScore = 70; // Start with a moderate score
  
  // Apply Wikipedia penalty
  if (!channelData.hasWikipedia) {
    contentQualityScore -= 20;
  }
  
  // Add points for educational content
  contentQualityScore += Math.min(educationalTerms * 2, 30);
  
  // Calculate appropriateness score with stricter penalties
  let appropriatenessScore = 70; // Start high

  // Apply significant penalty for ANY inappropriate content
  const totalInappropriate = inappropriateTerms.severe + inappropriateTerms.moderate + inappropriateTerms.mild;
  
  if (totalInappropriate > 0) {
    // Apply penalty based on severity
    const severePenalty = inappropriateTerms.severe * 40; // 40 points per severe term
    const moderatePenalty = inappropriateTerms.moderate * 15; // 15 points per moderate term
    const mildPenalty = inappropriateTerms.mild * 10; // 10 points per mild term
    
    // Calculate total penalty with caps
    const totalPenalty = Math.min(severePenalty, 45) + 
                        Math.min(moderatePenalty, 30) + 
                        Math.min(mildPenalty, 15);
    
    appropriatenessScore -= totalPenalty;
    
    // Cap the minimum score
    appropriatenessScore = Math.max(appropriatenessScore, 10);
  }
  
  // Calculate sentiment score
  const sentimentScore = Math.round(
    50 + (channelData.sentimentAnalysis.positive - channelData.sentimentAnalysis.negative) * 0.5
  );
  
  // Calculate credibility score
  const credibilityScore = channelData.hasWikipedia ? 65 : 35;
  
  // Calculate engagement score
  const engagementScore = 60 + Math.min(channelData.redditPosts.length * 2, 30);
  
  // Calculate relevance score
  const relevanceScore = 50 + Math.min(educationalTerms, 40);
  
  // Calculate overall score
  const overallScore = Math.round(
    sentimentScore * 0.15 +
    contentQualityScore * 0.25 +
    credibilityScore * 0.25 +
    relevanceScore * 0.15 +
    appropriatenessScore * 0.1 +
    engagementScore * 0.1
  );
  
  // Create description for appropriateness that includes detected keywords
  let appropriatenessDescription = `Content appropriateness shows ${totalInappropriate > 0 ? 
    `concerns (${inappropriateTerms.severe} severe, ${inappropriateTerms.moderate} moderate, ${inappropriateTerms.mild} mild issues)` : 
    'no concerning mentions'}.`;
  
  // Add detected keywords to the description if they exist
  if (totalInappropriate > 0) {
    if (detectedTerms.severe.length > 0) {
      appropriatenessDescription += ` Severe terms detected: [${detectedTerms.severe.join(', ')}].`;
    }
    if (detectedTerms.moderate.length > 0) {
      appropriatenessDescription += ` Moderate terms detected: [${detectedTerms.moderate.join(', ')}].`;
    }
    if (detectedTerms.mild.length > 0) {
      appropriatenessDescription += ` Mild terms detected: [${detectedTerms.mild.join(', ')}].`;
    }
  }
  
  return {
    overallScore,
    metrics: {
      audienceSentiment: {
        score: sentimentScore,
        description: `Audience sentiment shows ${channelData.sentimentAnalysis.positive.toFixed(1)}% positive engagement.`
      },
      contentQuality: {
        score: contentQualityScore,
        description: `${channelData.hasWikipedia ? 'Wikipedia presence indicates notable content.' : 'Lack of Wikipedia presence (-20 points)'} with ${educationalTerms} educational mentions.`
      },
      credibility: {
        score: credibilityScore,
        description: `Based on ${channelData.hasWikipedia ? 'Wikipedia presence' : 'absence of Wikipedia'} and ${channelData.newsArticles.length} news mentions.`
      },
      relevance: {
        score: relevanceScore,
        description: `Relevance based on educational terms (${educationalTerms}) and overall impact.`
      },
      appropriateness: {
        score: appropriatenessScore,
        description: appropriatenessDescription,
        detectedKeywords: detectedTerms
      },
      engagement: {
        score: engagementScore,
        description: `Engagement from ${channelData.redditPosts.length} Reddit posts and comment patterns.`
      }
    },
    analysis: `${channelData.channelTitle} shows ${overallScore >= 80 ? 'strong' : overallScore >= 60 ? 'moderate' : 'limited'} influence. ${channelData.hasWikipedia ? 'Wikipedia presence boosts credibility' : 'Lack of Wikipedia impacts content quality assessment'}. Educational value (${educationalTerms} mentions) and content appropriateness (${totalInappropriate > 0 ? `${totalInappropriate} concerns` : 'no issues'}) are key factors.`,
    recommendations: [
      channelData.hasWikipedia ? 
        "Continue building on established credibility" : 
        "Work toward Wikipedia inclusion through notable content",
      educationalTerms > 10 ?
        "Expand educational focus for increased relevance" :
        "Increase educational content for better quality scores",
      totalInappropriate > 0 ?
        "Address content appropriateness for improved scores" :
        "Maintain high content standards while expanding reach",
      "Develop more engagement through Reddit and other platforms"
    ]
  };
}