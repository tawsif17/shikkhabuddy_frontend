import { describe, expect, it } from "vitest"
import {
  entitlementErrorMessages,
  matchEntitlementErrorByExactMessage,
  validateContactSubmitRequest,
  validateProgressDashboardRequest,
  validateProgressDashboardResponse,
  validatePracticeGenerateRequest,
  validateQuestionsListRequest,
} from "../lib/api/contracts"
import { ApiClientError } from "../lib/api/client"

describe("matchEntitlementErrorByExactMessage", () => {
  it("matches exact entitlement message for 403", () => {
    const error = new ApiClientError({ message: entitlementErrorMessages.freeModeBlocked }, 403)
    expect(matchEntitlementErrorByExactMessage(error)).toEqual({
      type: "freeModeBlocked",
      message: entitlementErrorMessages.freeModeBlocked,
    })
  })

  it("does not match non-exact or non-403 errors", () => {
    const nonExact = new ApiClientError({ message: "Free plan supports only MCQ mode" }, 403)
    const wrongStatus = new ApiClientError({ message: entitlementErrorMessages.freeModeBlocked }, 400)

    expect(matchEntitlementErrorByExactMessage(nonExact)).toBeNull()
    expect(matchEntitlementErrorByExactMessage(wrongStatus)).toBeNull()
  })
})

describe("contract request validators", () => {
  it("validates questions list required fields", () => {
    const valid = validateQuestionsListRequest({ exam_type_id: 1, subject_id: 2 })
    expect(valid).toEqual({ exam_type_id: 1, subject_id: 2 })

    expect(() => validateQuestionsListRequest({ exam_type_id: 1 } as never)).toThrow()
    expect(() =>
      validateQuestionsListRequest({ exam_type_id: 1, subject_id: 2, extra: "x" } as never)
    ).toThrow()
  })

  it("validates contact submit required fields and rejects extras", () => {
    const valid = validateContactSubmitRequest({
      name: "Student Name",
      email: "student@example.com",
      message: "I need help with the platform.",
    })

    expect(valid).toEqual({
      name: "Student Name",
      email: "student@example.com",
      message: "I need help with the platform.",
    })

    expect(() =>
      validateContactSubmitRequest({
        name: "Student Name",
        email: "student@example.com",
      } as never)
    ).toThrow()

    expect(() =>
      validateContactSubmitRequest({
        name: "Student Name",
        email: "student@example.com",
        message: "I need help with the platform.",
        subject: "Extra field",
      } as never)
    ).toThrow()
  })

  it("validates practice generate CHAPTERS requires chapter_ids", () => {
    const valid = validatePracticeGenerateRequest({
      exam_type_id: 1,
      subject_id: 2,
      mode: "MCQ",
      selection: { type: "CHAPTERS", chapter_ids: [5] },
    })

    expect(valid.selection.chapter_ids).toEqual([5])

    expect(() =>
      validatePracticeGenerateRequest({
        exam_type_id: 1,
        subject_id: 2,
        mode: "MCQ",
        selection: { type: "CHAPTERS" },
      })
    ).toThrow("selection.chapter_ids is required when selection.type is CHAPTERS")
  })

  it("validates progress dashboard request and response contracts", () => {
    expect(validateProgressDashboardRequest()).toEqual({})
    expect(() => validateProgressDashboardRequest({ extra: "x" } as never)).toThrow()

    const valid = validateProgressDashboardResponse({
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
    })

    expect(valid.recommendation?.generate_payload.selection.chapter_ids).toEqual([11])

    expect(() =>
      validateProgressDashboardResponse({
        message: null,
        proficiency: null,
        weakness_ranking: [],
        recommendation: {
          label: "Bad payload",
          generate_payload: {
            exam_type_id: 1,
            subject_id: 1,
            mode: "MCQ",
            selection: {
              type: "CHAPTERS",
            },
          },
        },
      })
    ).toThrow(
      "recommendation.generate_payload.selection.chapter_ids is required when selection.type is CHAPTERS"
    )
  })
})
