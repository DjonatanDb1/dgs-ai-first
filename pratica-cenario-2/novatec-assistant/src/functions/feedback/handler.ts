import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import pino from "pino";
import {
	buildFeedbackRecord,
	redactEmail,
	validateFeedbackInput,
	type FeedbackRecord
} from "./validator";

const logger = pino({ name: "feedback-endpoint" });

async function saveFeedback(feedback: FeedbackRecord): Promise<void> {
	// Persistence integration is intentionally isolated from handler logic.
	// Replace with repository call (for example Cosmos SDK) in infrastructure phase.
	void feedback;
}

export async function feedbackHandler(
	request: HttpRequest,
	context: InvocationContext
): Promise<HttpResponseInit> {
	if (request.method !== "POST") {
		return {
			status: 405,
			jsonBody: {
				error: "Method Not Allowed"
			}
		};
	}

	let payload: unknown;

	try {
		payload = await request.json();
	} catch {
		logger.warn({ invocationId: context.invocationId }, "Invalid JSON for feedback request");
		return {
			status: 400,
			jsonBody: {
				error: "Invalid JSON payload"
			}
		};
	}

	const validation = validateFeedbackInput(payload);

	if (!validation.success) {
		logger.warn(
			{
				invocationId: context.invocationId,
				errors: validation.errors
			},
			"Feedback validation failed"
		);

		return {
			status: 400,
			jsonBody: {
				error: "ValidationError",
				details: validation.errors
			}
		};
	}

	const feedback = buildFeedbackRecord(validation.data);
	await saveFeedback(feedback);

	logger.info(
		{
			invocationId: context.invocationId,
			queryId: feedback.queryId,
			rating: feedback.rating,
			attendantEmailMasked: redactEmail(feedback.attendantEmail)
		},
		"Feedback saved"
	);

	return {
		status: 200,
		jsonBody: {
			status: "ok"
		}
	};
}

app.http("feedback", {
	methods: ["POST"],
	handler: feedbackHandler
});
