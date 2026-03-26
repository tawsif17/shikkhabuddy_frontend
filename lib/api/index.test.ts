import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  generatePractice,
  getProgressDashboard,
  resendVerification,
  submitContact,
  upgradeToPro,
  verifyEmail,
} from "./index"
import { apiClient } from "./client"

vi.mock("./client", () => ({
  apiClient: vi.fn(),
}))

describe("auth API contract calls", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls verify email endpoint with exact contract payload", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({ message: "Email verified successfully" })

    await verifyEmail({ token: "abc-token" })

    expect(apiClient).toHaveBeenCalledWith("/auth/verify-email", {
      method: "POST",
      body: { token: "abc-token" },
    })
  })

  it("calls resend verification endpoint with exact contract payload", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      message: "If the account is eligible, a verification email has been sent.",
    })

    await resendVerification({ email: "student@example.com" })

    expect(apiClient).toHaveBeenCalledWith("/auth/resend-verification", {
      method: "POST",
      body: { email: "student@example.com" },
    })
  })

  it("calls upgrade to pro endpoint with exact contract payload", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      message: "Upgrade successful. Pro trial is now active.",
      plan_tier: "pro",
    })

    await upgradeToPro()

    expect(apiClient).toHaveBeenCalledWith("/auth/upgrade-to-pro", {
      method: "POST",
      body: {},
      requiresAuth: true,
    })
  })

  it("calls contact endpoint with exact contract payload", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      message: "Contact message submitted successfully.",
    })

    await submitContact({
      name: " Student Name ",
      email: " student@example.com ",
      message: " I need help with the platform. ",
    })

    expect(apiClient).toHaveBeenCalledWith("/contact", {
      method: "POST",
      body: {
        name: "Student Name",
        email: "student@example.com",
        message: "I need help with the platform.",
      },
      includeAuth: true,
    })
  })
})

describe("analytics API contract calls", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls progress dashboard endpoint with exact contract options", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      message: null,
      proficiency: {
        score: 65,
        trend_vs_last_week: 4,
      },
      weakness_ranking: [],
      recommendation: null,
    })

    await getProgressDashboard()

    expect(apiClient).toHaveBeenCalledWith("/profile/progress-dashboard", {
      requiresAuth: true,
    })
  })

  it("forwards recommendation payload to practice generate exactly", async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      practice_session_id: 42,
      mcq_total: 25,
      cq_total: 0,
    })

    await generatePractice({
      exam_type_id: 1,
      subject_id: 1,
      mode: "MCQ",
      mcq_count: 25,
      selection: {
        type: "CHAPTERS",
        chapter_ids: [11, 12],
      },
    })

    expect(apiClient).toHaveBeenCalledWith("/practice/generate", {
      method: "POST",
      body: {
        exam_type_id: 1,
        subject_id: 1,
        mode: "MCQ",
        mcq_count: 25,
        selection: {
          type: "CHAPTERS",
          chapter_ids: [11, 12],
        },
      },
      requiresAuth: true,
    })
  })
})
