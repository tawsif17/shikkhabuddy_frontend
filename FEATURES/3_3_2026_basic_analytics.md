# Basic Analytics Frontend

## Status
proposed

## Problem
The frontend has a placeholder weak-areas page that explicitly references a non-existent analytics endpoint. The backend now exposes one contract-defined MVP analytics endpoint, so the frontend should ship a basic authenticated dashboard without inventing any additional API surface.

## Scope
- Add a basic analytics dashboard driven by the existing progress-dashboard contract.
- Surface server-provided proficiency, weak chapter ranking, and the single recommended next practice.
- Allow users to start the recommended practice by reusing the contract-defined recommendation payload with the existing practice-generation endpoint.
- Keep analytics MVP limited to MCQ-derived data only, matching the contract.

## Out of Scope
- Any new analytics endpoint such as `/analytics/weak-areas`.
- Topic-level, concept-level, or non-MCQ analytics.
- Backend contract changes.

## Screens/routes
- `GET /dashboard`
  - New primary analytics route.
  - Fetches and renders the authenticated student progress dashboard.
  - Shows overall proficiency, weak chapter ranking, and recommended next practice.
- `GET /dashboard/weak-areas`
  - Existing route should reuse the same progress-dashboard response shape or link back to `/dashboard`.
  - Must not call any separate weak-areas endpoint.
  - If kept as a standalone page, it should present the `weakness_ranking` slice only.
- Recommended practice action from `/dashboard`
  - When `recommendation` is present, clicking the primary CTA submits the server-provided `generate_payload`.
  - On success, navigate to `/practice/{practice_session_id}`.

## UX states (loading/empty/error/success)

### Route: `/dashboard`
- Loading
  - While `GET /api/profile/progress-dashboard` is in flight.
  - Render skeletons/placeholders for the score, weak areas list, and recommendation card.
- Empty
  - Contract-defined empty state is `200` with `data.message = "Not enough data yet"`, `proficiency = null`, `weakness_ranking = []`, and `recommendation = null`.
  - Show the server message as the primary state.
  - Hide analytics charts/cards that require populated data.
  - Include a CTA to start normal practice from existing discovery flows.
- Error
  - `401`: unauthenticated state; redirect to login or show auth-required messaging.
  - `404`: treat as unavailable profile/dashboard data and show a retryable fallback.
  - `500` or network failure: generic retryable error state.
- Success
  - Render `proficiency.score`, optional `proficiency.trend_vs_last_week`, ordered `weakness_ranking`, and recommendation content when present.
  - If `recommendation` is `null`, render the analytics data without the recommendation CTA.

### Route: `/dashboard/weak-areas`
- Loading
  - If this route fetches directly, same loading state as `/dashboard`.
  - If it consumes shared state from `/dashboard`, show a local loading placeholder until hydrated.
- Empty
  - No weak areas available because `weakness_ranking` is empty.
  - Reuse the same contract-driven "Not enough data yet" interpretation.
- Error
  - Same error handling as `/dashboard`; no route-specific endpoint should exist.
- Success
  - Render the ranked weak chapters only, preserving backend ordering.

### Action: recommended practice CTA
- Loading
  - While `POST /api/practice/generate` is in flight, disable the CTA.
- Empty
  - No CTA if `recommendation` is `null`.
- Error
  - `400`, `401`, `403`, `404`: show request-time failure and keep the user on `/dashboard`.
  - `500` or network failure: generic retryable error.
- Success
  - Navigate to `/practice/{practice_session_id}`.
  - If the response includes `warning`, surface it before or during navigation.

## Exact endpoints used
Source: `project_docs/CONTRACTS/api.md`

1. `GET /api/profile/progress-dashboard`
- Auth: Bearer token required.
- Request schema: `project_docs/CONTRACTS/schemas/profile.progress-dashboard.get.json#/properties/request`
- Success schema: `project_docs/CONTRACTS/schemas/profile.progress-dashboard.get.json#/properties/response`
- Success status: `200`
- Error statuses: `401`, `404`, `500`
- Contract notes to honor:
  - Analytics are derived from submitted MCQ answers only.
  - If the user has no submitted MCQ answer data, the response returns `Not enough data yet`.
  - Weakness ranking and recommendation use only MCQ rows that resolve to explicit chapters.
  - The recommendation payload is intended to be reused with `POST /api/practice/generate`.

2. `POST /api/practice/generate`
- Used only when the dashboard response includes `data.recommendation`.
- Auth: Bearer token required.
- Request schema: `project_docs/CONTRACTS/schemas/practice.generate.post.json#/properties/request`
- Success schema: `project_docs/CONTRACTS/schemas/practice.generate.post.json#/properties/response`
- Success status: `201`
- Error statuses: `400`, `401`, `403`, `404`, `500`
- Contract note to honor:
  - The dashboard recommendation is MCQ-first and should be submitted as provided, not reshaped into an invented format.

No separate analytics endpoint exists in `project_docs/CONTRACTS/`. The frontend must not call `/analytics/weak-areas` or any similar path.

## Validation rules (mirror schemas)
Source:
- `project_docs/CONTRACTS/schemas/profile.progress-dashboard.get.json`
- `project_docs/CONTRACTS/schemas/practice.generate.post.json`

### `GET /api/profile/progress-dashboard`
- Request must send no query parameters.
- Request must send no body fields.
- Request schema allows empty `query` and empty `body` objects only (`additionalProperties: false`).
- Authorization is required via bearer token.

### Progress dashboard response contract
- Top level:
  - `success` is required and must be `true`.
  - `data` is required.
- `data.message`
  - Required.
  - Type: `string | null`.
- `data.proficiency`
  - Type: `object | null`.
  - If present, it requires:
    - `score: integer` with `minimum: 0`, `maximum: 100`
    - `trend_vs_last_week: integer | null`
  - No additional fields allowed.
- `data.weakness_ranking`
  - Required array.
  - Each item requires:
    - `subject_id: integer`
    - `subject_name: string`
    - `chapter_id: integer`
    - `chapter_name: string`
    - `accuracy: integer` with `minimum: 0`, `maximum: 100`
    - `questions_attempted: integer` with `minimum: 0`
    - `message: string | null`
  - No additional item fields allowed.
- `data.recommendation`
  - Type: `object | null`.
  - If present, it requires:
    - `label: string`
    - `generate_payload: object`
  - No additional fields allowed.

### `data.recommendation.generate_payload`
- Required fields:
  - `exam_type_id: integer`
  - `subject_id: integer`
  - `mode: "MCQ"` (exact contract const for dashboard recommendation)
  - `selection: object`
- Optional fields:
  - `mcq_count: integer` with `minimum: 1`
  - `language: string`
- `selection` requires:
  - `type: "CHAPTERS"` (exact contract const for dashboard recommendation)
  - `chapter_ids: integer[]` with `minItems: 1` when present
- No additional fields allowed in `generate_payload` or `selection`.

### `POST /api/practice/generate` from analytics CTA
- Submit only the contract-defined keys from `recommendation.generate_payload`.
- Do not append client-only metadata or analytics fields.
- Request query must remain empty (`additionalProperties: false`).
- Body requires:
  - `exam_type_id`
  - `subject_id`
  - `mode`
  - `selection`
- Body allows optional `mcq_count`, `language`, and the other schema-defined count aliases, but analytics should forward the server payload as-is.

## Tests to add

1. API client tests
- Verify `/dashboard` requests `GET /api/profile/progress-dashboard` exactly.
- Assert no query params or request body are sent for the dashboard fetch.
- Verify the recommendation CTA requests `POST /api/practice/generate` with the exact `generate_payload` returned by the dashboard API.
- Assert no extra properties are added to the forwarded payload.

2. Route/component tests: `/dashboard`
- Loading state renders before the dashboard request resolves.
- Contract empty state (`Not enough data yet`, null proficiency, empty ranking, null recommendation) renders the empty UX path.
- Success state renders score, trend, ordered weak areas, and recommendation label.
- Success state without recommendation renders analytics without the CTA.
- `401` renders auth-required behavior.
- `404` renders the unavailable fallback.
- `500` or network failure renders retryable error UI.

3. Route/component tests: `/dashboard/weak-areas`
- Uses only `weakness_ranking` data from the progress-dashboard contract.
- Empty ranking renders the empty state.
- Does not issue any request to a non-contract weak-areas endpoint.

4. Interaction tests: recommended practice CTA
- CTA is hidden when `recommendation` is `null`.
- CTA shows loading/disabled state during submission.
- Successful submit navigates to `/practice/{practice_session_id}`.
- `warning` in the generate response is surfaced.
- `400`, `401`, `403`, and `404` keep the user on `/dashboard` and show an error state.

5. Regression tests
- Guard against any fetch to `/analytics/weak-areas` or other endpoints not listed in `project_docs/CONTRACTS/api.md`.
- Ensure the frontend treats the dashboard response as MCQ-only analytics and does not assume unsupported topic-level data.
