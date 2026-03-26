import { UpgradeSuccessContent } from "./upgrade-success-content"
import { Suspense } from "react"
import { PageShell } from "@/components/page-shell"

export const metadata = {
  title: "Upgrade Successful | Shikkha Buddy",
  description: "Your plan is now upgraded to pro.",
}

export default function PricingSuccessPage() {
  return (
    <Suspense fallback={<PageShell><div className="min-h-[calc(100vh-8rem)]" /></PageShell>}>
      <UpgradeSuccessContent />
    </Suspense>
  )
}
