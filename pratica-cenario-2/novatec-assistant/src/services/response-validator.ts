import pino from "pino";
import { z } from "zod";

const logger = pino({ name: "response-validator" });

const structuredOutputSchema = z
	.object({
		answer: z
			.string({ required_error: "answer is required" })
			.trim()
			.min(1, "answer must not be empty"),
		source_document: z
			.string({ required_error: "source_document is required" })
			.trim()
			.min(1, "source_document must not be empty"),
		confidence_score: z
			.number({ required_error: "confidence_score is required" })
			.min(0, "confidence_score must be between 0 and 1")
			.max(1, "confidence_score must be between 0 and 1")
	})
	.strict();

export type StructuredResponse = z.infer<typeof structuredOutputSchema>;

export const SAFE_FALLBACK_RESPONSE: StructuredResponse = {
	answer:
		"Nao foi possivel responder com seguranca a partir das fontes disponiveis. Encaminhe para revisao humana.",
	source_document: "N/A",
	confidence_score: 0
};

export type ValidationResult = {
	accepted: boolean;
	reason:
		| "ok"
		| "invalid_schema"
		| "missing_source_document"
		| "dangerous_cargo_return_without_negative";
	response: StructuredResponse;
};

const dangerousCargoPattern =
	/(cargas?\s+perigosas?|classe\s*[1-6]\b|classes\s*[1-6]\b|antt)/i;
const returnPattern = /(devolu(c|ç)(a|ã)o|devolver|devolvid[oa]s?)/i;
const negativePattern =
	/(nao\b|n[aã]o\b|nao\s+pode(m)?|n[aã]o\s+pode(m)?|proibid|ineleg[ií]vel|imposs[ií]vel|vedad)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function parseRawResponse(rawResponse: unknown): unknown {
	if (typeof rawResponse !== "string") {
		return rawResponse;
	}

	try {
		return JSON.parse(rawResponse);
	} catch {
		return rawResponse;
	}
}

function hasMissingSourceDocument(rawResponse: unknown): boolean {
	if (!isRecord(rawResponse)) {
		return false;
	}

	if (!("source_document" in rawResponse)) {
		return true;
	}

	const source = rawResponse.source_document;
	return typeof source !== "string" || source.trim().length === 0;
}

function hasDangerousCargoReturnWithoutNegative(answer: string): boolean {
	const normalized = answer.normalize("NFKC");
	const mentionsDangerousCargo = dangerousCargoPattern.test(normalized);
	const mentionsReturn = returnPattern.test(normalized);
	const hasNegative = negativePattern.test(normalized);

	return mentionsDangerousCargo && mentionsReturn && !hasNegative;
}

export function validateModelResponse(rawResponse: unknown): ValidationResult {
	const parsedInput = parseRawResponse(rawResponse);

	if (hasMissingSourceDocument(parsedInput)) {
		logger.warn("Response blocked: source_document missing");
		return {
			accepted: false,
			reason: "missing_source_document",
			response: SAFE_FALLBACK_RESPONSE
		};
	}

	const parsed = structuredOutputSchema.safeParse(parsedInput);

	if (!parsed.success) {
		logger.warn(
			{
				issues: parsed.error.issues.map((issue) => ({
					path: issue.path.join("."),
					message: issue.message
				}))
			},
			"Structured output validation failed"
		);

		return {
			accepted: false,
			reason: "invalid_schema",
			response: SAFE_FALLBACK_RESPONSE
		};
	}

	const response = parsed.data;

	if (hasDangerousCargoReturnWithoutNegative(response.answer)) {
		logger.warn(
			{
				answer: response.answer,
				source_document: response.source_document
			},
			"Response blocked: dangerous cargo + return without explicit negative"
		);

		return {
			accepted: false,
			reason: "dangerous_cargo_return_without_negative",
			response: SAFE_FALLBACK_RESPONSE
		};
	}

	return {
		accepted: true,
		reason: "ok",
		response
	};
}

export { structuredOutputSchema };
