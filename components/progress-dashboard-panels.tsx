"use client"

import Link from "next/link"
import { Brain, Sparkles, Target, TrendingUp } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ProgressDashboardResponse } from "@/lib/api"

interface ProgressDashboardPanelsProps {
  dashboard: ProgressDashboardResponse
  variant?: "full" | "weak-areas"
  isGenerating?: boolean
  actionError?: string | null
  actionNotice?: string | null
  onStartRecommendation?: () => void
}

export function ProgressDashboardPanels({
  dashboard,
  variant = "full",
  isGenerating = false,
  actionError = null,
  actionNotice = null,
  onStartRecommendation,
}: ProgressDashboardPanelsProps) {
  const isEmpty =
    dashboard.message === "Not enough data yet" &&
    dashboard.proficiency === null &&
    dashboard.weakness_ranking.length === 0 &&
    dashboard.recommendation === null

  if (isEmpty) {
    return (
      <Card className="border-border bg-card/90">
        <CardContent className="px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Brain className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Not enough data yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Complete a few submitted MCQ practice sessions to unlock your first analytics snapshot.
          </p>
          <Button asChild className="mt-5">
            <Link href="/subjects">Start practice</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {variant === "full" && dashboard.proficiency && (
        <Card className="overflow-hidden border-border bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader className="border-b border-border/70 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Overall proficiency</CardTitle>
                <CardDescription>MCQ accuracy from your submitted sessions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 px-6 py-6 md:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <div className="text-5xl font-bold tracking-tight text-foreground">
                {dashboard.proficiency.score}
                <span className="ml-1 text-2xl text-muted-foreground">%</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                This score reflects your current overall MCQ performance across submitted practice.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Weekly trend
              </p>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {dashboard.proficiency.trend_vs_last_week === null
                  ? "N/A"
                  : `${dashboard.proficiency.trend_vs_last_week > 0 ? "+" : ""}${dashboard.proficiency.trend_vs_last_week}%`}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Compared with the last 7 days of MCQ performance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card/90">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle>{variant === "full" ? "Weak chapter ranking" : "Your weak chapters"}</CardTitle>
              <CardDescription>Ranked from lowest to highest accuracy</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {dashboard.weakness_ranking.length > 0 ? (
            dashboard.weakness_ranking.map((item, index) => (
              <div
                key={`${item.subject_id}-${item.chapter_id}`}
                className="rounded-2xl border border-border/70 bg-background/70 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Rank {index + 1}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">{item.chapter_name}</h3>
                    <p className="text-sm text-muted-foreground">{item.subject_name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:min-w-[210px]">
                    <div className="rounded-xl bg-muted/70 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Accuracy</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{item.accuracy}%</p>
                    </div>
                    <div className="rounded-xl bg-muted/70 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Attempts</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{item.questions_attempted}</p>
                    </div>
                  </div>
                </div>
                {item.message && (
                  <p className="mt-3 text-sm text-amber-700">{item.message}</p>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              No weak areas available yet.
            </div>
          )}
        </CardContent>
      </Card>

      {variant === "full" && dashboard.recommendation && (
        <Card className="border-border bg-gradient-to-br from-emerald-500/5 via-card to-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10">
                <Sparkles className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <CardTitle>Recommended next practice</CardTitle>
                <CardDescription>Generated from your weakest MCQ-linked chapters</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <p className="text-base font-medium text-foreground">{dashboard.recommendation.label}</p>
            </div>

            {actionError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {actionError}
              </div>
            )}

            {actionNotice && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-700">
                {actionNotice}
              </div>
            )}

            {onStartRecommendation && (
              <Button onClick={onStartRecommendation} disabled={isGenerating} className="w-full sm:w-auto">
                {isGenerating ? "Starting practice..." : "Start recommended practice"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
