import { SpanStatusCode, trace } from "@opentelemetry/api";

type User = {
	id: number;
	name: string;
};

export async function UsersList() {
	const tracer = trace.getTracer("users-list");
	return await tracer.startActiveSpan("fetch users", async (span) => {
		try {
			const url = "https://jsonplaceholder.typicode.com/users";
			span.setAttribute("http.method", "GET");
			span.setAttribute("url.full", url);

			const response = await fetch(url);
			span.setAttribute("http.status_code", response.status);

			const data: User[] = await response.json();
			return (
				<div>
					{data.map((user: User) => (
						<div key={user.id}>{user.name}</div>
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
