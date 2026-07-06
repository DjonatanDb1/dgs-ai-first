import { z } from "zod";

const feedbackSchema = z
	.object({
		queryId: z
			.string({ required_error: "queryId is required" })
			.trim()
			.min(1, "queryId must not be empty"),
		rating: z
			.number({ required_error: "rating is required" })
			.int("rating must be an integer")
			.min(1, "rating must be between 1 and 5")
			.max(5, "rating must be between 1 and 5"),
		comment: z
			.string({ required_error: "comment is required" })
			.trim()
			.min(1, "comment must not be empty")
			.max(1000, "comment must be at most 1000 characters"),
		attendantEmail: z
			.string({ required_error: "attendantEmail is required" })
			.email("attendantEmail must be a valid email")
	})
	.strict();

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export type FeedbackRecord = {
	queryId: string;
	rating: number;
	comment: string;
	attendantEmail: string;
	timestamp: string;
};

export type FeedbackValidationResult =
	| { success: true; data: FeedbackInput }
	| { success: false; errors: string[] };

export function validateFeedbackInput(payload: unknown): FeedbackValidationResult {
	const parsed = feedbackSchema.safeParse(payload);

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

export function buildFeedbackRecord(input: FeedbackInput): FeedbackRecord {
	return {
		queryId: input.queryId,
		rating: input.rating,
		comment: input.comment,
		attendantEmail: input.attendantEmail,
		timestamp: new Date().toISOString()
	};
}

export function redactEmail(email: string): string {
	const [localPart, domainPart] = email.split("@");
	if (!localPart || !domainPart) {
		return "redacted";
	}

	const first = localPart.slice(0, 1);
	return `${first}***@${domainPart}`;
}
