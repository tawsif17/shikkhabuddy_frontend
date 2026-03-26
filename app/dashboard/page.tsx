"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Brain, RotateCcw, Sparkles } from "@/components/icons"
import { Breadcrumb } from "@/components/breadcrumb"
import { PageShell } from "@/components/page-shell"
import { ProgressDashboardPanels } from "@/components/progress-dashboard-panels"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { generatePractice } from "@/lib/api"
import { useProgressDashboard } from "@/lib/api/hooks"
import { ApiClientError, formatApiError } from "@/lib/api/client"
import { useAuth } from "@/lib/auth-context"

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { dashboard, isLoading, isError, mutate } = useProgressDashboard(isAuthenticated)
  const [isGenerating, setIsGenerating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?next=%2Fdashboard")
    }
  }, [authLoading, isAuthenticated, router])

  const handleStartRecommendation = async () => {
    if (!dashboard?.recommendation) {
      return
    }

    setIsGenerating(true)
    setActionError(null)
    setActionNotice(null)

    try {
      const response = await generatePractice(dashboard.recommendation.generate_payload)

      if (response.warning?.message) {
        setActionNotice(response.warning.message)
        window.setTimeout(() => {
          router.push(`/practice/${response.practice_session_id}`)
        }, 700)
        return
      }

      router.push(`/practice/${response.practice_session_id}`)
    } catch (error) {
      setActionError(formatApiError(error))
    } finally {
      setIsGenerating(false)
    }
  }

  const dashboardUnauthorized = isError instanceof ApiClientError && isError.status === 401

  return (
    <PageShell>
      <section className="border-b border-border bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_32%),radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_28%),linear-gradient(to_bottom,rgba(248,250,252,0.98),rgba(248,250,252,0.92))]">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-3xl">
            <div className="mb-6">
              <Breadcrumb items={[{ label: "Dashboard" }]} />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
              <Sparkles className="h-4 w-4" />
              Basic analytics
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              See where your practice is getting stronger.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Your dashboard uses submitted MCQ performance to highlight weak chapters and recommend the next practice set.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 md:py-12">
        {authLoading || isLoading ? (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">Loading analytics...</p>
            <Skeleton className="h-56 rounded-3xl" />
            <Skeleton className="h-72 rounded-3xl" />
            <Skeleton className="h-44 rounded-3xl" />
          </div>
        ) : dashboardUnauthorized ? (
          <Card className="border-border">
            <CardContent className="px-6 py-8 text-center">
              <p className="text-sm text-muted-foreground">Authorization token missing or invalid</p>
              <Button asChild className="mt-4">
                <Link href="/login?next=%2Fdashboard">Login to continue</Link>
              </Button>
            </CardContent>
          </Card>
        ) : isError ? (
          <Card className="border-border">
            <CardContent className="px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                <Brain className="h-7 w-7 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Unable to load analytics</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {isError instanceof ApiClientError && isError.status === 404
                  ? "Your dashboard data is not available right now. Please try again shortly."
                  : "We could not load your progress dashboard. Please try again."}
              </p>
              <Button onClick={() => void mutate()} variant="outline" className="mt-5 bg-transparent">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : dashboard ? (
          <ProgressDashboardPanels
            dashboard={dashboard}
            isGenerating={isGenerating}
            actionError={actionError}
            actionNotice={actionNotice}
            onStartRecommendation={dashboard.recommendation ? handleStartRecommendation : undefined}
          />
        ) : null}
      </section>
    </PageShell>
  )
}
