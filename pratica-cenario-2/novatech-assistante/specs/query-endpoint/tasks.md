# Tasks — Query Endpoint

## TQ-01 — Setup HTTP endpoint + input validation
- Description: Implement `POST /api/query` handler in Azure Functions v4 and validate input with Zod (`question` required).
- Acceptance Criteria:
  - Endpoint rejects methods different from POST with HTTP 405.
  - Endpoint returns HTTP 400 when body is missing `question` or `question` is empty.
  - Endpoint accepts valid payload and returns placeholder response with `source_document`.
  - No `console.log`; uses structured logging with pino.
- Dependencies: none.
- Estimate: P.

## TQ-02 — Azure OpenAI embedding client
- Description: Create service to generate embeddings for `question` with retry and exponential backoff.
- Acceptance Criteria:
  - Retries transient failures (429/5xx) with exponential backoff.
  - Logs attempt metadata and latency.
  - Returns typed embedding vector.
- Dependencies: TQ-01.
- Estimate: M.

## TQ-03 — Azure AI Search retrieval top-5
- Description: Query index and return top-5 chunks with source metadata and recency fields.
- Acceptance Criteria:
  - Always returns at most 5 chunks ordered by score.
  - Includes `source_document`, `section`, `effective_date`, and `score`.
  - Handles empty retrieval deterministically.
- Dependencies: TQ-02.
- Estimate: M.

## TQ-04 — Prompt builder with context budget guardrails
- Description: Build prompt using system prompt + chunks + user question respecting ADR-0002 budget.
- Acceptance Criteria:
  - Enforces approximately 4K tokens for system prompt and 8K tokens for retrieved chunks.
  - Preserves source attribution for every included chunk.
  - Truncation strategy is deterministic and logged.
- Dependencies: TQ-03.
- Estimate: M.

## TQ-05 — Completion call + output schema
- Description: Call GPT-4o and validate output schema including `source_document`.
- Acceptance Criteria:
  - Validates response with Zod before returning to caller.
  - Returns fallback for low confidence with explicit warning.
  - Never returns response without `source_document` field.
- Dependencies: TQ-04.
- Estimate: M.

## TQ-06 — Contradiction handling by recency (ADR-0003)
- Description: Apply recency metadata rule when conflicting documents are present.
- Acceptance Criteria:
  - Prioritizes latest effective version.
  - Mentions existence of previous version when contradiction is detected.
  - Behavior covered by integration test.
- Dependencies: TQ-03, TQ-05.
- Estimate: M.

## TQ-07 — Endpoint integration tests
- Description: Add integration tests for validation errors, happy path, no-match fallback, and contradiction scenario.
- Acceptance Criteria:
  - Includes tests for 405, 400 invalid body, and accepted valid payload.
  - Includes scenario for dangerous cargo + return policy.
  - Uses fixtures and deterministic mocks only.
- Dependencies: TQ-01, TQ-05, TQ-06.
- Estimate: G.
