export type RouteHandler = (request: Request) => Promise<Response>;

/**
 * Points the page's `fetch` at a composed route handler.
 *
 * A screen test then drives the real path — the form submits, the component
 * posts, the route parses, the pipeline runs, the store writes, the response
 * comes back and renders — with only the network hop removed. Nothing about
 * the request or the response is faked.
 */
export function installRouteFetch(routes: Record<string, RouteHandler>): () => void {
  const original = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? new URL(input, "http://localhost")
        : input instanceof URL
          ? input
          : new URL(input.url, "http://localhost");

    const handler = routes[url.pathname];
    if (!handler) {
      throw new Error(`No route handler installed for ${url.pathname}`);
    }

    const request =
      typeof input === "string" || input instanceof URL
        ? new Request(url, init)
        : input;

    return handler(request);
  }) as typeof fetch;

  return () => {
    globalThis.fetch = original;
  };
}
