"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { InfluenceScore } from "@/lib/types"
import {
  MessageSquare,
  TrendingUp,
  BookOpen,
  MessageCircle,
  Check,
  Sparkles,
  AlertTriangle,
  Share2,
  Printer,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface InfluenceDetailsProps {
  influenceData: InfluenceScore
}

export default function InfluenceDetails({ influenceData }: InfluenceDetailsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Find specific metrics
  const sentimentMetric = influenceData.metrics.find((m) => m.type === "sentiment")
  const qualityMetric = influenceData.metrics.find((m) => m.type === "quality")
  const credibilityMetric = influenceData.metrics.find((m) => m.type === "credibility")
  const relevanceMetric = influenceData.metrics.find((m) => m.type === "relevance")
  const appropriatenessMetric = influenceData.metrics.find((m) => m.type === "appropriateness")
  const engagementMetric = influenceData.metrics.find((m) => m.type === "engagement")

  // Check if content has low appropriateness score (potentially 18+ or harmful)
  const hasInappropriateContent = appropriatenessMetric && appropriatenessMetric.score < 50

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null)
    } else {
      setExpandedSection(section)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `InfluenceIQ Analysis: ${influenceData.channelTitle}`,
          text: `Check out this influence analysis of ${influenceData.channelTitle} - Overall Score: ${influenceData.overallScore}/100`,
          url: window.location.href,
        })
        .catch((err) => {
          console.error("Error sharing:", err)
        })
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert("Link copied to clipboard!")
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
          AI-Powered Analysis
        </CardTitle>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share Analysis</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Print Analysis</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {hasInappropriateContent && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This content may contain inappropriate material. The analysis indicates potential adult (18+) or harmful
              content.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
            <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-2">Influence Analysis for {influenceData.channelTitle}</h3>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium mb-2 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Overall Influence Score
                  </h4>
                  <div className="flex items-center justify-between">
                    <div
                      className={`text-4xl font-bold ${
                        influenceData.overallScore >= 80
                          ? "text-green-500"
                          : influenceData.overallScore >= 60
                            ? "text-blue-500"
                            : influenceData.overallScore >= 40
                              ? "text-yellow-500"
                              : "text-red-500"
                      }`}
                    >
                      {influenceData.overallScore}
                    </div>
                    <div className="w-1/2 h-3 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          influenceData.overallScore >= 80
                            ? "bg-green-500"
                            : influenceData.overallScore >= 60
                              ? "bg-blue-500"
                              : influenceData.overallScore >= 40
                                ? "bg-yellow-500"
                                : "bg-red-500"
                        }`}
                        style={{ width: `${influenceData.overallScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium mb-2">Channel Information</h4>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Subscribers:</span> {influenceData.subscriberCount}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Last Updated:</span>{" "}
                    {new Date(influenceData.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50 hover:shadow-md transition-shadow">
                <h4 className="font-medium mb-2 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                  AI Analysis Summary
                </h4>
                <p className="text-sm whitespace-pre-line">{influenceData.geminiAnalysis.analysis}</p>
              </div>

              {hasInappropriateContent && (
                <div className="mt-4 border border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="font-medium mb-2 flex items-center text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Content Warning
                  </h4>
                  <p className="text-sm text-red-600">
                    This creator's content has been flagged for potentially inappropriate material. The appropriateness
                    score is low ({appropriatenessMetric?.score}/100), which may indicate adult content, excessive
                    vulgarity, or harmful material.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4 pt-4">
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-4">Detailed Metrics</h3>

              <Accordion type="single" collapsible className="w-full">
                {sentimentMetric && (
                  <AccordionItem value="sentiment">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        <span>Audience Sentiment</span>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            sentimentMetric.score >= 70
                              ? "bg-green-100 text-green-800"
                              : sentimentMetric.score >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {sentimentMetric.score}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-2">
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
                          <div
                            className={`h-full rounded-full ${
                              sentimentMetric.score >= 70
                                ? "bg-green-500"
                                : sentimentMetric.score >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${sentimentMetric.score}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{sentimentMetric.description}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {qualityMetric && (
                  <AccordionItem value="quality">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <Sparkles className="h-4 w-4 mr-2" />
                        <span>Content Quality</span>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            qualityMetric.score >= 70
                              ? "bg-green-100 text-green-800"
                              : qualityMetric.score >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {qualityMetric.score}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-2">
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
                          <div
                            className={`h-full rounded-full ${
                              qualityMetric.score >= 70
                                ? "bg-green-500"
                                : qualityMetric.score >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${qualityMetric.score}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{qualityMetric.description}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {credibilityMetric && (
                  <AccordionItem value="credibility">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span>Credibility</span>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            credibilityMetric.score >= 70
                              ? "bg-green-100 text-green-800"
                              : credibilityMetric.score >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {credibilityMetric.score}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-2">
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
                          <div
                            className={`h-full rounded-full ${
                              credibilityMetric.score >= 70
                                ? "bg-green-500"
                                : credibilityMetric.score >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${credibilityMetric.score}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{credibilityMetric.description}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {relevanceMetric && (
                  <AccordionItem value="relevance">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        <span>Field Relevance</span>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            relevanceMetric.score >= 70
                              ? "bg-green-100 text-green-800"
                              : relevanceMetric.score >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {relevanceMetric.score}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-2">
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
                          <div
                            className={`h-full rounded-full ${
                              relevanceMetric.score >= 70
                                ? "bg-green-500"
                                : relevanceMetric.score >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${relevanceMetric.score}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{relevanceMetric.description}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {appropriatenessMetric && (
                  <AccordionItem value="appropriateness">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        {appropriatenessMetric.score < 50 ? (
                          <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        <span>Content Appropriateness</span>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            appropriatenessMetric.score >= 70
                              ? "bg-green-100 text-green-800"
                              : appropriatenessMetric.score >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {appropriatenessMetric.score}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-2">
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
                          <div
                            className={`h-full rounded-full ${
                              appropriatenessMetric.score >= 70
                                ? "bg-green-500"
                                : appropriatenessMetric.score >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${appropriatenessMetric.score}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{appropriatenessMetric.description}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {engagementMetric && (
                  <AccordionItem value="engagement">
                    <AccordionTrigger>
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        <span>Audience Engagement</span>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            engagementMetric.score >= 70
                              ? "bg-green-100 text-green-800"
                              : engagementMetric.score >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {engagementMetric.score}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-2">
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-4">
                          <div
                            className={`h-full rounded-full ${
                              engagementMetric.score >= 70
                                ? "bg-green-500"
                                : engagementMetric.score >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${engagementMetric.score}%` }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">{engagementMetric.description}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 pt-4">
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-2 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                AI-Powered Analysis
              </h3>

              <div className="mt-4 border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50 hover:shadow-md transition-shadow">
                <p className="text-sm whitespace-pre-line">{influenceData.geminiAnalysis.analysis}</p>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-2">Key Strengths</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {influenceData.metrics
                    .filter((metric) => metric.score >= 70)
                    .map((metric) => (
                      <div
                        key={metric.type}
                        className="border rounded-lg p-3 bg-green-50 hover:shadow-md transition-shadow"
                      >
                        <h5 className="text-sm font-medium text-green-700">{metric.label}</h5>
                        <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                      </div>
                    ))}
                  {influenceData.metrics.filter((metric) => metric.score >= 70).length === 0 && (
                    <div className="border rounded-lg p-3 bg-gray-50 col-span-2">
                      <p className="text-sm text-muted-foreground">
                        No exceptional strengths identified. All metrics are below 70.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-2">Areas for Improvement</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {influenceData.metrics
                    .filter((metric) => metric.score < 60)
                    .map((metric) => (
                      <div
                        key={metric.type}
                        className="border rounded-lg p-3 bg-yellow-50 hover:shadow-md transition-shadow"
                      >
                        <h5 className="text-sm font-medium text-yellow-700">{metric.label}</h5>
                        <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
                      </div>
                    ))}
                  {influenceData.metrics.filter((metric) => metric.score < 60).length === 0 && (
                    <div className="border rounded-lg p-3 bg-gray-50 col-span-2">
                      <p className="text-sm text-muted-foreground">
                        No significant areas for improvement identified. All metrics are above 60.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4 pt-4">
            <div className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-4">Recommendations</h3>

              <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-md transition-shadow">
                <h4 className="font-medium mb-3 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                  AI-Generated Recommendations
                </h4>

                <ul className="space-y-3">
                  {influenceData.geminiAnalysis.recommendations && 
                   influenceData.geminiAnalysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5">
                        <span className="text-xs font-medium text-blue-700">{index + 1}</span>
                      </div>
                      <p className="text-sm">{recommendation}</p>
                    </li>
                  ))}
                  {(!influenceData.geminiAnalysis.recommendations || 
                    influenceData.geminiAnalysis.recommendations.length === 0) && (
                    <li className="text-sm text-muted-foreground">
                      No specific recommendations available for this content.
                    </li>
                  )}
                </ul>
              </div>

              {hasInappropriateContent && (
                <div className="mt-4 border border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="font-medium mb-2 flex items-center text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Content Appropriateness Warning
                  </h4>
                  <p className="text-sm text-red-600 mb-2">
                    This creator's content has been flagged for potentially inappropriate material. Consider the
                    following recommendations:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-red-600">
                    <li>Review platform guidelines to ensure compliance</li>
                    <li>Consider your audience demographics when creating content</li>
                    <li>Reduce excessive vulgarity or controversial content</li>
                    <li>Focus on being authentic without being unnecessarily provocative</li>
                    <li>Be aware that inappropriate content may limit monetization opportunities</li>
                  </ul>
                </div>
              )}

              <div className="mt-6">
                <Button variant="outline" onClick={handleShare} className="mr-2">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Analysis
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

