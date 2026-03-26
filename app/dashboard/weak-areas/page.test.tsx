import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type React from "react"
import WeakAreaDashboardPage from "./page"
import { ApiClientError } from "@/lib/api/client"
import { useProgressDashboard } from "@/lib/api/hooks"
import { useAuth } from "@/lib/auth-context"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock("@/components/page-shell", () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/components/breadcrumb", () => ({
  Breadcrumb: () => <div>Breadcrumb</div>,
}))

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}))

vi.mock("@/lib/api/hooks", () => ({
  useProgressDashboard: vi.fn(),
}))

describe("weak areas dashboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    })
    vi.mocked(useProgressDashboard).mockReturnValue({
      dashboard: undefined,
      isLoading: false,
      isError: null,
      mutate: vi.fn(),
    })
  })

  it("shows loading state while weak areas are loading", () => {
    vi.mocked(useProgressDashboard).mockReturnValue({
      dashboard: undefined,
      isLoading: true,
      isError: null,
      mutate: vi.fn(),
    })

    render(<WeakAreaDashboardPage />)

    expect(screen.getByText("Loading weak areas...")).toBeInTheDocument()
  })

  it("renders ranked weak areas from the progress dashboard contract", () => {
    vi.mocked(useProgressDashboard).mockReturnValue({
      dashboard: {
        message: null,
        proficiency: {
          score: 65,
          trend_vs_last_week: 4,
        },
        weakness_ranking: [
          {
            subject_id: 1,
            subject_name: "Higher Math",
            chapter_id: 11,
            chapter_name: "Vectors",
            accuracy: 42,
            questions_attempted: 12,
            message: null,
          },
        ],
        recommendation: null,
      },
      isLoading: false,
      isError: null,
      mutate: vi.fn(),
    })

    render(<WeakAreaDashboardPage />)

    expect(screen.getByText("Your weak chapters")).toBeInTheDocument()
    expect(screen.getByText("Vectors")).toBeInTheDocument()
    expect(screen.queryByText("Coming Soon")).not.toBeInTheDocument()
  })

  it("renders auth-required state for unauthorized errors", () => {
    vi.mocked(useProgressDashboard).mockReturnValue({
      dashboard: undefined,
      isLoading: false,
      isError: new ApiClientError({ message: "Authorization token missing or invalid" }, 401),
      mutate: vi.fn(),
    })

    render(<WeakAreaDashboardPage />)

    expect(screen.getByText("Authorization token missing or invalid")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Login to continue" })).toHaveAttribute(
      "href",
      "/login?next=%2Fdashboard%2Fweak-areas"
    )
  })
})
