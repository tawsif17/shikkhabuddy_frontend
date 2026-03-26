import type React from "react"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import SignUpPage from "./page"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/components/page-shell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    register: vi.fn(),
  }),
}))

describe("signup page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows demo credentials guidance", () => {
    render(<SignUpPage />)

    expect(
      screen.getByText(
        /Email verification is unavailable in this demo version\. Use the following credentials to try it out\./
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/Dummy free user email:/)).toBeInTheDocument()
    expect(screen.getByText(/Dummy pro user email:/)).toBeInTheDocument()
    expect(screen.getByText(/Password:/)).toBeInTheDocument()
  })
})
