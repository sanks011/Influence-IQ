import { Suspense } from "react"
import Link from "next/link"
import { getTopCreators } from "@/lib/db-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function TopCreatorsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4">Top Creators by Influence</h1>
        </div>

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
      </div>
    </main>
  )
}

async function TopCreatorsList() {
  const creators = await getTopCreators(20)

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
    <div className="grid gap-4 md:grid-cols-2">
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

