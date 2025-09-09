import { SpanStatusCode, trace } from "@opentelemetry/api";

type Post = {
	userId: number;
	id: number;
	title: string;
	body: string;
};

export async function PostsList() {
	const tracer = trace.getTracer("posts-list");
	return await tracer.startActiveSpan("fetch posts", async (span) => {
		try {
			const url = "https://jsonplaceholder.typicode.com/posts";
			span.setAttribute("http.method", "GET");
			span.setAttribute("url.full", url);

			const response = await fetch(url);
			span.setAttribute("http.status_code", response.status);

			const data: Post[] = await response.json();
			return (
				<div>
					{data.map((post: Post) => (
						<div key={post.id}>{post.title}</div>
					))}
				</div>
			);
		} catch (error) {
			span.recordException(error as Error);
			span.setStatus({ code: SpanStatusCode.ERROR });
			throw error;
		} finally {
			span.end();
		}
	});
}
