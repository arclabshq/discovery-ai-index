import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import worker, { buildArxivUrl, parseArxivEntries } from "../worker/index.js";

function registryEnv(rows) {
  return {
    DB: {
      prepare(sql) {
        return {
          bind(status) {
            return {
              all: async () => ({
                results: rows.filter((row) => row.status === status),
              }),
            };
          },
        };
      },
    },
    ASSETS: {
      fetch: async () => new Response("missing", { status: 404 }),
    },
  };
}

test("serves existing static assets without a fallback", async () => {
  const calls = [];
  const response = await worker.fetch(new Request("https://example.test/assets/app.js"), {
    ASSETS: {
      fetch: async (request) => {
        calls.push(new URL(request.url).pathname);
        return new Response("asset", { status: 200 });
      },
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/assets/app.js"]);
});

test("falls back to index.html for an unknown app route", async () => {
  const calls = [];
  const response = await worker.fetch(
    new Request("https://example.test/flow/step-two?source=share", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => {
          const url = new URL(request.url);
          calls.push(url.pathname + url.search);
          return new Response(url.pathname === "/index.html" ? "app" : "missing", {
            status: url.pathname === "/index.html" ? 200 : 404,
          });
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/flow/step-two?source=share", "/index.html"]);
});

test("does not turn missing API or write requests into the app shell", async () => {
  for (const request of [
    new Request("https://example.test/api/missing", { headers: { accept: "application/json" } }),
    new Request("https://example.test/flow", { method: "POST", headers: { accept: "text/html" } }),
  ]) {
    let calls = 0;
    const response = await worker.fetch(request, {
      ASSETS: {
        fetch: async () => {
          calls += 1;
          return new Response("missing", { status: 404 });
        },
      },
    });

    assert.equal(response.status, 404);
    assert.equal(calls, 1);
  }
});

test("public registry exposes verified and under-review records but not candidates", async () => {
  const shared = {
    slug: "record",
    title: "Record",
    summary: "Summary",
    field: "Science",
    ai_system: "System",
    announced_at: "2025-01-01",
    source_url: "https://example.test/source",
  };
  const response = await worker.fetch(
    new Request("https://example.test/api/registry"),
    registryEnv([
      { ...shared, id: "verified", status: "verified" },
      { ...shared, id: "review", status: "under_review" },
      { ...shared, id: "candidate", status: "candidate" },
    ]),
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.verified.map((item) => item.id), ["verified"]);
  assert.deepEqual(body.underReview.map((item) => item.id), ["review"]);
  assert.equal(
    [...body.verified, ...body.underReview].some((item) => item.id === "candidate"),
    false,
  );
  assert.equal(body.policy.publishing, "human_review_required");
});

test("public discovery endpoint rejects candidate access", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/api/discoveries?status=candidate"),
    registryEnv([]),
  );
  assert.equal(response.status, 400);
});

test("editorial writes fail closed without a configured token", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/api/editorial/discoveries/example/transition", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "verified", note: "Checked" }),
    }),
    registryEnv([]),
  );
  assert.equal(response.status, 503);
});

test("candidate intake parser normalizes primary arXiv links", () => {
  const entries = parseArxivEntries(`
    <feed>
      <entry>
        <id>http://arxiv.org/abs/2506.13131v2</id>
        <published>2025-06-16T06:37:18Z</published>
        <title>  A novel AI discovery &amp; result  </title>
        <summary>Machine learning discovers a new algorithm.</summary>
        <category term="cs.AI" />
      </entry>
    </feed>
  `);

  assert.deepEqual(entries, [
    {
      externalId: "2506.13131",
      sourceUrl: "https://arxiv.org/abs/2506.13131",
      title: "A novel AI discovery & result",
      summary: "Machine learning discovers a new algorithm.",
      announcedAt: "2025-06-16",
      field: "cs.AI",
    },
  ]);
});

test("scheduled intake query is bounded by date and result count", () => {
  const url = new URL(
    buildArxivUrl(new Date("2026-07-23T12:00:00Z"), {
      INTAKE_LOOKBACK_DAYS: "7",
      INTAKE_MAX_RESULTS: "9",
    }),
  );
  assert.equal(url.searchParams.get("max_results"), "9");
  assert.match(url.searchParams.get("search_query"), /20260716120000 TO 20260723120000/);
});

test("emits the files required by Sites packaging", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/server/index.js", import.meta.url));
  await access(new URL("../dist/.openai/hosting.json", import.meta.url));
  await access(new URL("../dist/.openai/drizzle/0001_discovery_registry.sql", import.meta.url));
  await access(new URL("../dist/.openai/drizzle/0002_production_registry.sql", import.meta.url));
});
