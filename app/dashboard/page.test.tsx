import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type React from "react"
import DashboardPage from "./page"
import { ApiClientError } from "@/lib/api/client"
import { generatePractice } from "@/lib/api"
import { useProgressDashboard } from "@/lib/api/hooks"
import { useAuth } from "@/lib/auth-context"

const mockPush = vi.fn()
const mockMutate = vi.fn()

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

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api")
  return {
    ...actual,
    generatePractice: vi.fn(),
  }
})

describe("dashboard page", () => {
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
      mutate: mockMutate,
    })
  })

  it("shows loading state while dashboard data is in flight", () => {
    vi.mocked(useProgressDashboard).mockReturnValue({
      dashboard: undefined,
      isLoading: true,
      isError: null,
      mutate: mockMutate,
    })

    render(<DashboardPage />)

    expect(screen.getByText("Loading analytics...")).toBeInTheDocument()
  })

  it("renders contract empty state when there is not enough data", () => {
    vi.mocked(useProgressDashboard).mockReturnValue({
      dashboard: {
        message: "Not enough data yet",
        proficiency: null,
        weakness_ranking: [],
        recommendation: null,
      },
      isLoading: false,
      isError: null,
      mutate: mockMutate,
    })

    render(<DashboardPage />)

    expect(screen.getByText("Not enough data yet")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Start practice" })).toHaveAttribute("href", "/subjects")
  })

  it("renders analytics and starts recommended practice", async () => {
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
        recommendation: {
          label: "Recommended: 25 MCQs from Vectors",
          generate_payload: {
            exam_type_id: 1,
            subject_id: 1,
            mode: "MCQ",
            mcq_count: 25,
            selection: {
              type: "CHAPTERS",
              chapter_ids: [11],
            },
          },
        },
      },
      isLoading: false,
      isError: null,
      mutate: mockMutate,
    })
    vi.mocked(generatePractice).mockResolvedValueOnce({
      practice_session_id: 42,
      mcq_total: 25,
      cq_total: 0,
    })

    render(<DashboardPage />)

    expect(screen.getByText("Overall proficiency")).toBeInTheDocument()
    expect(screen.getByText("Vectors")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Start recommended practice" }))

    await waitFor(() => {
      expect(generatePractice).toHaveBeenCalledWith({
        exam_type_id: 1,
        subject_id: 1,
        mode: "MCQ",
        mcq_count: 25,
        selection: {
          type: "CHAPTERS",
          chapter_ids: [11],
        },
      })
    })

    expect(mockPush).toHaveBeenCalledWith("/practice/42")
  })

  it("renders retryable error state for 404 responses", () => {
    vi.mocked(useProgressDashboard).mockReturnValue({
      dashboard: undefined,
      isLoading: false,
      isError: new ApiClientError({ message: "Not found" }, 404),
      mutate: mockMutate,
    })

    render(<DashboardPage />)

    expect(screen.getByText("Unable to load analytics")).toBeInTheDocument()
    expect(
      screen.getByText("Your dashboard data is not available right now. Please try again shortly.")
    ).toBeInTheDocument()
  })
})
