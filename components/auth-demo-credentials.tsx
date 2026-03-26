"use client"

export function AuthDemoCredentials() {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        Email verification is unavailable in this demo version. Use the following credentials to
        try it out.
      </p>
      <div className="mt-2 space-y-1 text-foreground">
        <p>
          <span className="font-medium">Dummy free user email:</span> dummy.user@example.com
        </p>
        <p>
          <span className="font-medium">Dummy pro user email:</span> pro.user@example.com
        </p>
        <p>
          <span className="font-medium">Password:</span> Password123
        </p>
      </div>
    </div>
  )
}
