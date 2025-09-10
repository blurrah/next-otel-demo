import { SpanStatusCode, trace } from "@opentelemetry/api";
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	tool,
	type UIMessage,
} from "ai";
import z from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
	const { messages }: { messages: UIMessage[] } = await req.json();

	const result = streamText({
		model: "openai/gpt-4o",
		stopWhen: stepCountIs(10),
		tools: {
			pokemonInfo: pokemonInfoTool,
		},
		messages: convertToModelMessages(messages),
		experimental_telemetry: {
			isEnabled: true,
			functionId: "chat",
		},
	});

	return result.toUIMessageStreamResponse();
}

const pokemonInfoTool = tool({
	name: "pokemonInfo",
	description:
		"Use the poke API to get information about a pokemon, this uses pokeapi.co/api/v2/ and ",
	inputSchema: z.object({
		path: z
			.string()
			.describe(
				"The path to the pokemon information without a preceding slash, it gets added to https://pokeapi.co/api/v2/",
			),
	}),
	execute: async ({ path }: { path: string }): Promise<string> => {
		return trace
			.getTracer("next-app")
			.startActiveSpan("pokeapi.fetch", async (span) => {
				const url = `https://pokeapi.co/api/v2/${path}`;
				span.setAttribute("component", "pokemonInfoTool");
				span.setAttribute("url.full", url);
				span.setAttribute("http.method", "GET");
				try {
					const response = await fetch(url);
					span.setAttribute("http.status_code", response.status);
					const data = await response.json();
					span.setStatus({ code: SpanStatusCode.OK });
					return data as string;
				} catch (error) {
					if (error instanceof Error) {
						span.recordException(error);
						span.setStatus({
							code: SpanStatusCode.ERROR,
							message: error.message,
						});
					} else {
						span.setStatus({
							code: SpanStatusCode.ERROR,
							message: "Unknown error",
						});
					}
					return `Error: ${error instanceof Error ? error.toString() : "Unknown error"}`;
				} finally {
					span.end();
				}
			});
	},
});
