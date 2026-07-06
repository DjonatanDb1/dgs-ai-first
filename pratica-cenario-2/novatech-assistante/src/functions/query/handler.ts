import type { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import pino from "pino";
import {
  buildAcceptedPlaceholderResponse,
  buildMethodNotAllowedResponse,
  buildValidationErrorResponse
} from "./response-builder";
import { validateQueryRequest } from "./validator";

const logger = pino({ name: "query-endpoint" });

export async function queryHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  if (request.method !== "POST") {
    logger.warn({ method: request.method }, "Rejected non-POST request");
    return buildMethodNotAllowedResponse();
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    logger.warn("Invalid JSON body");
    return buildValidationErrorResponse(["request body must be valid JSON"]);
  }

  const validation = validateQueryRequest(payload);

  if (!validation.success) {
    logger.warn({ errors: validation.errors }, "Input validation failed");
    return buildValidationErrorResponse(validation.errors);
  }

  logger.info(
    {
      invocationId: context.invocationId,
      questionLength: validation.data.question.length
    },
    "Accepted query request"
  );

  return buildAcceptedPlaceholderResponse();
}
