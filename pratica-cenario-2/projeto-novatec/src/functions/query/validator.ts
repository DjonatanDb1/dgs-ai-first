import { z } from "zod";

const queryRequestSchema = z.object({
  question: z
    .string({ required_error: "question is required" })
    .trim()
    .min(1, "question must not be empty")
    .max(1000, "question is too long")
});

export type QueryRequest = z.infer<typeof queryRequestSchema>;

export type ValidationResult =
  | { success: true; data: QueryRequest }
  | { success: false; errors: string[] };

export function validateQueryRequest(payload: unknown): ValidationResult {
  const parsed = queryRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return {
      success: false,
      errors: parsed.error.issues.map((issue) => issue.message)
    };
  }

  return {
    success: true,
    data: parsed.data
  };
}
