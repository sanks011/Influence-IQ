"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Loader2, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

export default function SearchForm({ 
  initialQuery = "", 
  isAnalyzePage = false 
}: { 
  initialQuery?: string;
  isAnalyzePage?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery)
  const [isLoading, setIsLoading] = useState(false)
  const [showLoadingDialog, setShowLoadingDialog] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const loadingStartTimeRef = useRef<number | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const isInitialMount = useRef(true)
  const currentQueryRef = useRef<string | null>(null)
  const MINIMUM_LOADING_TIME = 4000 // Minimum time in ms to show the loading dialog

  // Function to finish the analysis and close the dialog
  const completeAnalysis = useCallback(() => {
    if (!isLoading) return
    
    const currentTime = Date.now()
    const loadingTime = loadingStartTimeRef.current ? currentTime - loadingStartTimeRef.current : 0
    
    // Fast transition to 100%
    setProgress(100)
    stopProgressSimulation()
    
    // Calculate remaining time to meet minimum display duration
    const remainingTime = Math.max(0, MINIMUM_LOADING_TIME - loadingTime)
    
    setTimeout(() => {
      setIsLoading(false)
      setShowLoadingDialog(false)
      
      // Reset the current query reference
      currentQueryRef.current = null
      loadingStartTimeRef.current = null
    }, remainingTime)
  }, [isLoading])

  // Reset loading state when the URL query parameter changes
  useEffect(() => {
    const urlQuery = searchParams.get("query")

    // Skip on initial mount to prevent immediate reset
    if (isInitialMount.current) {
      isInitialMount.current = false
      currentQueryRef.current = urlQuery
      return
    }

    // If we have a query parameter and we're in loading state, we can assume
    // the page has navigated and results are being rendered in the background
    if (urlQuery !== null && isLoading) {
      // Handle edge case where query might be different than what we submitted
      if (urlQuery !== currentQueryRef.current) {
        currentQueryRef.current = urlQuery
      }
      
      // Allow a brief moment for the results to render
      setTimeout(() => {
        completeAnalysis()
      }, 1000) // Give the results page a moment to load
    }
  }, [searchParams, isLoading, completeAnalysis])

  // Create a custom event listener to detect when results are fully loaded
  useEffect(() => {
    const handleResultsLoaded = () => {
      if (isLoading) {
        completeAnalysis()
      }
    }

    // Listen for a custom event from the results component
    window.addEventListener('resultsLoaded', handleResultsLoaded)
    
    return () => {
      window.removeEventListener('resultsLoaded', handleResultsLoaded)
    }
  }, [isLoading, completeAnalysis])

  const startProgressSimulation = () => {
    // Record start time
    loadingStartTimeRef.current = Date.now()
    
    // Reset progress
    setProgress(0)

    // Faster progress simulation with larger increments
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          // Don't go to 100% automatically, that happens when navigation completes
          return prev
        }

        // Faster progression with larger steps
        if (prev < 30) return prev + 10
        if (prev < 60) return prev + 7
        if (prev < 80) return prev + 3
        if (prev < 90) return prev + 1
        return prev + 0.5
      })
    }, 100) // Decreased interval time for faster updates
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

      // Set a fallback timeout in case other detection methods fail
      const fallbackTimeout = setTimeout(() => {
        if (isLoading) {
          completeAnalysis()
        }
      }, 15000) // 15 seconds max loading time

      // Important change: Use the correct route based on whether we're on the analyze page
      const targetPath = isAnalyzePage ? `/analyze?query=${encodedQuery}` : `/?query=${encodedQuery}`
      router.push(targetPath)

      // Cleanup fallback timeout on next render
      return () => clearTimeout(fallbackTimeout)
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
      if (isAnalyzePage) {
        router.push("/analyze")
      } else {
        router.push("/")
      }
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