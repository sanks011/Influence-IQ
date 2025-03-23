"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

export default function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [isLoading, setIsLoading] = useState(false)
  const [showLoadingDialog, setShowLoadingDialog] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const isInitialMount = useRef(true)
  const currentQueryRef = useRef<string | null>(null)

  // Reset loading state when the URL query parameter changes
  useEffect(() => {
    const urlQuery = searchParams.get("query")

    // Skip on initial mount to prevent immediate reset
    if (isInitialMount.current) {
      isInitialMount.current = false
      currentQueryRef.current = urlQuery
      return
    }

    // If the URL query has changed from what we submitted, analysis is complete
    if (urlQuery !== null && urlQuery === currentQueryRef.current) {
      setIsLoading(false)
      setShowLoadingDialog(false)
      stopProgressSimulation()

      // Reset the current query reference
      currentQueryRef.current = null
    }
  }, [searchParams])

  const startProgressSimulation = () => {
    // Reset progress
    setProgress(0)

    // Simulate progress with non-linear increments to feel more realistic
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          // Don't go to 100% automatically, that happens when navigation completes
          return prev
        }

        // Slow down as we get closer to 100%
        if (prev < 30) return prev + 5
        if (prev < 60) return prev + 3
        if (prev < 80) return prev + 1.5
        if (prev < 90) return prev + 0.5
        return prev + 0.2
      })
    }, 150)
  }

  const stopProgressSimulation = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim()) return

    setIsLoading(true)
    setShowLoadingDialog(true)
    startProgressSimulation()

    try {
      // Validate the URL format first
      if (!isValidYouTubeUrl(query.trim()) && !query.trim().startsWith("@")) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid YouTube channel or video URL",
          variant: "destructive",
        })
        setIsLoading(false)
        setShowLoadingDialog(false)
        stopProgressSimulation()
        return
      }

      // Store the current query we're submitting to check against URL changes
      const encodedQuery = encodeURIComponent(query.trim())
      currentQueryRef.current = encodedQuery

      // Redirect to the results page
      router.push(`/?query=${encodedQuery}`)

      // The loading state will be cleared when the URL changes and the useEffect runs
    } catch (error) {
      console.error("Error analyzing channel:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze channel",
        variant: "destructive",
      })
      setIsLoading(false)
      setShowLoadingDialog(false)
      stopProgressSimulation()
    }
  }

  const handleCancel = () => {
    setShowLoadingDialog(false)
    setIsLoading(false)
    stopProgressSimulation()

    // If we're already on a results page, stay there
    // If not, go to home
    if (!initialQuery) {
      router.push("/")
    }

    toast({
      title: "Analysis cancelled",
      description: "You can try again when you're ready",
    })
  }

  // Basic validation for YouTube URLs
  const isValidYouTubeUrl = (url: string): boolean => {
    // Check if it's a YouTube URL
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      return true
    }

    // Check if it looks like a channel ID
    if (url.match(/^UC[a-zA-Z0-9_-]{22}$/)) {
      return true
    }

    return false
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex w-full max-w-2xl mx-auto gap-2 flex-col sm:flex-row">
        <Input
          type="text"
          placeholder="Enter YouTube channel URL or video URL"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading} className="sm:w-auto w-full">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Analyze
            </>
          )}
        </Button>
      </form>

      <Dialog open={showLoadingDialog} onOpenChange={setShowLoadingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Analyzing YouTube Creator</DialogTitle>
            <DialogDescription>
              We're gathering data from multiple sources to provide a comprehensive analysis.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="mb-2 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Analysis in progress...</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />

            <div className="mt-6 space-y-2">
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${progress > 10 ? "bg-green-500" : "bg-muted"}`}></div>
                <span className="text-sm">Fetching channel information</span>
              </div>
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${progress > 30 ? "bg-green-500" : "bg-muted"}`}></div>
                <span className="text-sm">Analyzing audience sentiment</span>
              </div>
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${progress > 50 ? "bg-green-500" : "bg-muted"}`}></div>
                <span className="text-sm">Checking credibility indicators</span>
              </div>
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${progress > 70 ? "bg-green-500" : "bg-muted"}`}></div>
                <span className="text-sm">Processing AI analysis</span>
              </div>
              <div className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${progress > 90 ? "bg-green-500" : "bg-muted"}`}></div>
                <span className="text-sm">Generating recommendations</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

