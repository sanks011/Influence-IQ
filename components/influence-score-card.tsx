"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Sparkles, Info } from "lucide-react"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface InfluenceScoreCardProps {
  score: number
  channelTitle: string
  channelThumbnail: string
  subscriberCount: string
  hasInappropriateContent?: boolean
}

export default function InfluenceScoreCard({
  score,
  channelTitle,
  channelThumbnail,
  subscriberCount,
  hasInappropriateContent = false,
}: InfluenceScoreCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-blue-500"
    if (score >= 40) return "text-yellow-500"
    return "text-red-500"
  }

  const getScoreLabel = () => {
    if (score >= 90) return "Exceptional"
    if (score >= 80) return "Excellent"
    if (score >= 70) return "Very Good"
    if (score >= 60) return "Good"
    if (score >= 50) return "Average"
    if (score >= 40) return "Below Average"
    if (score >= 30) return "Poor"
    return "Very Poor"
  }

  const getScoreDescription = () => {
    if (score >= 90) return "This creator demonstrates exceptional influence, credibility, and content quality."
    if (score >= 80) return "This creator has excellent influence with high credibility and quality content."
    if (score >= 70) return "This creator shows very good influence with solid credibility indicators."
    if (score >= 60) return "This creator has good influence with room for improvement in some areas."
    if (score >= 50) return "This creator has average influence compared to others in their field."
    if (score >= 40) return "This creator's influence is below average with significant room for improvement."
    if (score >= 30) return "This creator has poor influence metrics across most categories."
    return "This creator has very poor influence metrics and may have problematic content."
  }

  return (
    <Card
      className={`h-full transition-all duration-300 ${isHovered ? "shadow-lg" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/10">
            <Image
              src={channelThumbnail || "/placeholder.svg?height=64&width=64"}
              alt={channelTitle}
              fill
              className="object-cover"
            />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-xl font-semibold truncate">{channelTitle}</h2>
            <p className="text-sm text-muted-foreground">{subscriberCount} subscribers</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <div className="flex items-center justify-center">
            <Popover>
              <PopoverTrigger asChild>
                <div className="cursor-help flex items-center">
                  <div className={`text-5xl font-bold ${getScoreColor()}`}>{score}</div>
                  <Sparkles className="h-5 w-5 ml-2 text-purple-500" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Influence Score: {getScoreLabel()}</h4>
                  <p className="text-sm text-muted-foreground">{getScoreDescription()}</p>
                  <div className="pt-2">
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          score >= 80
                            ? "bg-green-500"
                            : score >= 60
                              ? "bg-blue-500"
                              : score >= 40
                                ? "bg-yellow-500"
                                : "bg-red-500"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="mt-2 text-sm text-muted-foreground flex items-center justify-center">
            <span>AI-Powered Influence Score</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 ml-1 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">
                    This score is generated by our AI based on multiple factors including content quality, credibility,
                    audience sentiment, and engagement metrics.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Progress value={score} className="mt-4" />

          <div className="mt-2 text-sm">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low Influence</span>
              <span>High Influence</span>
            </div>
          </div>

          {hasInappropriateContent && (
            <div className="mt-4 flex items-center justify-center text-xs text-red-500">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span>Content may be inappropriate</span>
            </div>
          )}

          <div className="mt-4 text-xs text-center text-muted-foreground">
            <span className="font-medium">{getScoreLabel()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

