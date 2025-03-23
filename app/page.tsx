import { Suspense } from "react"
import SearchForm from "@/components/search-form"
import CreatorResults from "@/components/creator-results"
import type { SearchParamsType } from "@/lib/types"
import { Loader2 } from "lucide-react"

export default function Home({ searchParams }: { searchParams: SearchParamsType }) {
  const query = searchParams.query || ""

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">InfluenceIQ</h1>
          <p className="text-lg sm:text-xl text-muted-foreground">
            Analyze YouTube creators based on credibility, influence, and engagement
          </p>
        </div>

        <SearchForm initialQuery={query} />

        {query && (
          <div className="mt-8">
            <Suspense
              fallback={
                <div className="flex flex-col justify-center items-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <span className="text-lg text-center">Analyzing creator influence...</span>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    This may take a moment as we gather data from multiple sources.
                  </p>
                </div>
              }
            >
              <CreatorResults query={query} />
            </Suspense>
          </div>
        )}
      </div>
    </main>
  )
}

