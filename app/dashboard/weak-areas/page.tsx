"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Breadcrumb } from "@/components/breadcrumb"
import { PageShell } from "@/components/page-shell"
import { ProgressDashboardPanels } from "@/components/progress-dashboard-panels"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useProgressDashboard } from "@/lib/api/hooks"
import { ApiClientError } from "@/lib/api/client"
import { useAuth } from "@/lib/auth-context"

export default function WeakAreaDashboardPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { dashboard, isLoading, isError } = useProgressDashboard(isAuthenticated)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?next=%2Fdashboard%2Fweak-areas")
    }
  }, [authLoading, isAuthenticated, router])

  const isUnauthorized = isError instanceof ApiClientError && isError.status === 401

  return (
    <PageShell>
      <section className="border-b border-border bg-secondary/40">
        <div className="container mx-auto px-4 py-10 md:py-12">
          <div className="mb-4">
            <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Weak Areas" }]} />
          </div>
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">Your learning focus</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            This view reuses the same contract-defined progress dashboard data and highlights only the ranked weak chapters.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 md:py-12">
        {authLoading || isLoading ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Loading weak areas...</p>
            <Skeleton className="h-24 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        ) : isUnauthorized ? (
          <Card className="border-border">
            <CardContent className="px-6 py-8 text-center">
              <p className="text-sm text-muted-foreground">Authorization token missing or invalid</p>
              <Button asChild className="mt-4">
                <Link href="/login?next=%2Fdashboard%2Fweak-areas">Login to continue</Link>
              </Button>
            </CardContent>
          </Card>
        ) : isError ? (
          <Card className="border-border">
            <CardContent className="px-6 py-8 text-center">
              <p className="text-destructive">Unable to load weak areas right now.</p>
            </CardContent>
          </Card>
        ) : dashboard ? (
          <ProgressDashboardPanels dashboard={dashboard} variant="weak-areas" />
        ) : null}
      </section>
    </PageShell>
  )
}
