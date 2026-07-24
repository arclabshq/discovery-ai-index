export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/discoveries" && request.method === "GET") {
      const status = url.searchParams.get("status");
      const query = status
        ? env.DB.prepare("SELECT * FROM discoveries WHERE status = ? ORDER BY announced_at DESC").bind(status)
        : env.DB.prepare("SELECT * FROM discoveries ORDER BY announced_at DESC");
      const { results } = await query.all();
      return Response.json({ discoveries: results });
    }

    const response = await env.ASSETS.fetch(request);
    const acceptsHtml = request.headers.get("accept")?.includes("text/html");

    if (response.status !== 404 || !acceptsHtml || !["GET", "HEAD"].includes(request.method)) {
      return response;
    }

    const indexUrl = new URL(request.url);
    indexUrl.pathname = "/index.html";
    indexUrl.search = "";
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
