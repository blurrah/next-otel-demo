import { convertToModelMessages, streamText, type UIMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
	const { messages }: { messages: UIMessage[] } = await req.json();

	const result = streamText({
		model: "openai/gpt-4o",
		messages: convertToModelMessages(messages),
		experimental_telemetry: {
			isEnabled: true,
			functionId: "chat",
		},
	});

	return result.toUIMessageStreamResponse();
}
