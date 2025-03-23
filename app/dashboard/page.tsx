import Link from "next/link"
import { Suspense } from "react"
import { getTopCreators } from "@/lib/db-service"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, BarChart3, TrendingUp, Users } from "lucide-react"
import Image from "next/image"

export default function DashboardPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">InfluenceIQ Dashboard</h1>
          <Link href="/">
            <Button>Analyze New Creator</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
                <CardDescription>Creator analyses performed</CardDescription>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Loader2 className="h-4 w-4 animate-spin" />}>
                <AnalysisCount />
              </Suspense>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">Average Influence</CardTitle>
                <CardDescription>Average score across creators</CardDescription>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Loader2 className="h-4 w-4 animate-spin" />}>
                <AverageScore />
              </Suspense>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">Top Creator Score</CardTitle>
                <CardDescription>Highest influence score</CardDescription>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Loader2 className="h-4 w-4 animate-spin" />}>
                <TopScore />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="top" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="top">Top Creators</TabsTrigger>
            <TabsTrigger value="recent">Recent Analyses</TabsTrigger>
          </TabsList>

          <TabsContent value="top" className="space-y-4 pt-4">
            <Suspense
              fallback={
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-lg">Loading top creators...</span>
                </div>
              }
            >
              <TopCreatorsList />
            </Suspense>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4 pt-4">
            <Suspense
              fallback={
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-lg">Loading recent analyses...</span>
                </div>
              }
            >
              <RecentAnalysesList />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

async function AnalysisCount() {
  const creators = await getTopCreators(100)
  return <div className="text-2xl font-bold">{creators.length}</div>
}

async function AverageScore() {
  const creators = await getTopCreators(100)

  if (creators.length === 0) {
    return <div className="text-2xl font-bold">N/A</div>
  }

  const totalScore = creators.reduce((sum, creator) => sum + creator.overallScore, 0)
  const average = Math.round(totalScore / creators.length)

  return <div className="text-2xl font-bold">{average}</div>
}

async function TopScore() {
  const creators = await getTopCreators(1)

  if (creators.length === 0) {
    return <div className="text-2xl font-bold">N/A</div>
  }

  return <div className="text-2xl font-bold">{creators[0].overallScore}</div>
}

async function TopCreatorsList() {
  const creators = await getTopCreators(10)

  if (creators.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">No creators have been analyzed yet.</p>
          <Link href="/" className="mt-4 inline-block">
            <Button>Analyze a Creator</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {creators.map((creator, index) => (
        <Card key={creator.channelId} className="overflow-hidden">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold mr-3">
                {index + 1}
              </div>
              <CardTitle className="text-lg">{creator.channelTitle}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="relative h-12 w-12 rounded-full overflow-hidden mr-4">
                <Image
                  src={creator.channelThumbnail || "/placeholder.svg?height=48&width=48"}
                  alt={creator.channelTitle}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{creator.subscriberCount} subscribers</span>
                  <div
                    className={`text-2xl font-bold ${
                      creator.overallScore >= 80
                        ? "text-green-500"
                        : creator.overallScore >= 60
                          ? "text-blue-500"
                          : creator.overallScore >= 40
                            ? "text-yellow-500"
                            : "text-red-500"
                    }`}
                  >
                    {creator.overallScore}
                  </div>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full ${
                      creator.overallScore >= 80
                        ? "bg-green-500"
                        : creator.overallScore >= 60
                          ? "bg-blue-500"
                          : creator.overallScore >= 40
                            ? "bg-yellow-500"
                            : "bg-red-500"
                    }`}
                    style={{ width: `${creator.overallScore}%` }}
                  />
                </div>
              </div>
            </div>
            <Link
              href={`/?query=${encodeURIComponent(`https://youtube.com/channel/${creator.channelId}`)}`}
              className="mt-4 w-full"
            >
              <Button variant="outline" size="sm" className="w-full">
                View Analysis
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function RecentAnalysesList() {
  // In a real implementation, you would sort by updatedAt
  // For now, we'll just use the top creators as a placeholder
  const creators = await getTopCreators(10)

  if (creators.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">No creators have been analyzed yet.</p>
          <Link href="/" className="mt-4 inline-block">
            <Button>Analyze a Creator</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {creators.map((creator) => (
        <Card key={creator.channelId}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
                  <Image
                    src={creator.channelThumbnail || "/placeholder.svg?height=40&width=40"}
                    alt={creator.channelTitle}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{creator.channelTitle}</h3>
                  <p className="text-xs text-muted-foreground">
                    Analyzed {new Date(creator.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className={`text-xl font-bold ${
                    creator.overallScore >= 80
                      ? "text-green-500"
                      : creator.overallScore >= 60
                        ? "text-blue-500"
                        : creator.overallScore >= 40
                          ? "text-yellow-500"
                          : "text-red-500"
                  }`}
                >
                  {creator.overallScore}
                </div>
                <Link href={`/?query=${encodeURIComponent(`https://youtube.com/channel/${creator.channelId}`)}`}>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

