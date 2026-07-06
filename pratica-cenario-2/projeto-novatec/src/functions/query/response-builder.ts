import type { HttpResponseInit } from "@azure/functions";

export function buildMethodNotAllowedResponse(): HttpResponseInit {
	return {
		status: 405,
		jsonBody: {
			error: "Method Not Allowed"
		}
	};
}

export function buildValidationErrorResponse(errors: string[]): HttpResponseInit {
	return {
		status: 400,
		jsonBody: {
			error: "ValidationError",
			details: errors,
			source_document: null
		}
	};
}

export function buildAcceptedPlaceholderResponse(): HttpResponseInit {
	return {
		status: 202,
		jsonBody: {
			answer: "Query accepted. Retrieval and completion pipeline not implemented yet.",
			source_document: null,
			confidence: "low"
		}
	};
}
