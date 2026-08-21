import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import worker, {
  buildArxivUrl,
  buildBiorxivUrl,
  buildCrossrefUrl,
  buildPubmedSearchUrl,
  parseArxivEntries,
  parseBiorxivEntries,
  parseCrossrefEntries,
  parsePubmedEntries,
  runCandidateIntake,
} from "../worker/index.js";

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

test("serves the root app shell for a discovery record before the asset layer can redirect it", async () => {
  const calls = [];
  const response = await worker.fetch(
    new Request("https://example.test/discoveries/record?source=share", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async (request) => {
          const url = new URL(request.url);
          calls.push(url.pathname + url.search);
          return new Response(url.pathname === "/" ? "app" : "redirected", {
            status: url.pathname === "/" ? 200 : 307,
          });
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls, ["/"]);
});

test("serves crawlable metadata, record HTML, and a public-record sitemap", async () => {
  const row = {
    id: "verified",
    slug: "record",
    title: "A useful discovery",
    summary: "A plain-language summary of the result.",
    field: "Science",
    ai_system: "Example system",
    ai_role_plain: "The system proposed candidates that researchers checked.",
    status: "verified",
    announced_at: "2026-07-24",
    verified_at: "2026-07-25",
    source_url: "https://example.test/source",
    source_label: "Primary paper",
    source_type: "Research publication",
    verification_note: "An independent check is documented.",
    evidence_level: "peer_reviewed",
    discovery_type: "discovery",
    validation_stage: "peer_reviewed",
    why_it_matters: "The result makes a useful capability possible.",
    history_start_label: null,
    history_start_date: null,
    history_result_label: null,
    history_duration_label: null,
    history_source_url: null,
    review_started_at: null,
    published_at: "2026-07-25",
    updated_at: "2026-07-25 12:00:00",
  };
  const appShell = `<!doctype html><html><head><title>Discovery</title><meta name="description" content="Description"><meta property="og:title" content="Discovery"><meta property="og:description" content="Description"><meta property="og:type" content="website"><meta property="og:url" content="https://example.test/"><meta name="twitter:title" content="Discovery"><meta name="twitter:description" content="Description"><link rel="canonical" href="https://example.test/"></head><body><div id="root"></div></body></html>`;
  const env = {
    DB: {
      prepare(sql) {
        if (sql.includes("slug = ?")) {
          return {
            bind(slug) {
              return { all: async () => ({ results: slug === row.slug ? [row] : [] }) };
            },
          };
        }
        return {
          all: async () => ({ results: [row] }),
        };
      },
    },
    ASSETS: {
      fetch: async () => new Response(appShell, { status: 200 }),
    },
  };

  const robots = await worker.fetch(new Request("https://example.test/robots.txt"), env);
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Sitemap: https:\/\/www\.discoveryindex\.arclabshq\.com\/sitemap\.xml/);

  const sitemap = await worker.fetch(new Request("https://example.test/sitemap.xml"), env);
  const sitemapBody = await sitemap.text();
  assert.equal(sitemap.status, 200);
  assert.match(sitemapBody, /<loc>https:\/\/www\.discoveryindex\.arclabshq\.com\/discoveries\/record<\/loc>/);

  const record = await worker.fetch(
    new Request("https://example.test/discoveries/record", {
      headers: { accept: "text/html" },
    }),
    env,
  );
  const recordBody = await record.text();
  assert.equal(record.status, 200);
  assert.match(recordBody, /<h1>A useful discovery<\/h1>/);
  assert.match(recordBody, /<meta name="robots" content="index, follow" \/>/);
  assert.match(recordBody, /<script type="application\/ld\+json">.*"@type":"Article"/s);
  assert.match(recordBody, /https:\/\/example\.test\/source/);

  const about = await worker.fetch(
    new Request("https://example.test/about", { headers: { accept: "text/html" } }),
    env,
  );
  assert.match(await about.text(), /<h1>The global catalog of discoveries materially enabled by AI\.<\/h1>/);
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

test("fails closed when the API Worker is deployed without an asset binding", async () => {
  const response = await worker.fetch(new Request("https://example.test/not-found"), {});

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Not found." });
});

test("public registry exposes verified and under-review records but not candidates", async () => {
  const shared = {
    slug: "record",
    title: "Record",
    summary: "Summary",
    field: "Science",
    ai_system: "System",
    ai_role_plain: "The system proposed candidates that researchers checked.",
    discovery_type: "design",
    validation_stage: "lab_confirmed",
    history_start_label: "Conjecture published",
    history_start_date: "2024-05-06",
    history_result_label: "Proof posted",
    history_duration_label: "776 days",
    history_source_url: "https://example.test/origin",
    announced_at: "2025-01-01",
    source_url: "https://example.test/source",
    updated_at: "2026-07-24 16:30:00",
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
  assert.equal(body.policy.publishing, "authenticated_review_required");
  assert.equal(
    body.verified[0].aiRole,
    "The system proposed candidates that researchers checked.",
  );
  assert.equal(body.verified[0].discoveryType, "design");
  assert.equal(body.verified[0].validationStage, "lab_confirmed");
  assert.equal(body.verified[0].updatedAt, "2026-07-24T16:30:00Z");
  assert.deepEqual(body.verified[0].history, {
    startLabel: "Conjecture published",
    startDate: "2024-05-06",
    resultLabel: "Proof posted",
    durationLabel: "776 days",
    sourceUrl: "https://example.test/origin",
  });
  assert.equal(body.lastEditorialUpdateAt, "2026-07-24T16:30:00Z");
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

test("automation writes fail closed without a configured token", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/api/automation/queue", {
      headers: { authorization: "Bearer automation-test" },
    }),
    registryEnv([]),
  );
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /AUTOMATION_TOKEN/);
});

test("automation queue uses its separate bearer token", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/api/automation/queue", {
      headers: { authorization: "Bearer automation-test" },
    }),
    {
      AUTOMATION_TOKEN: "automation-test",
      DB: {
        prepare() {
          return {
            all: async () => ({
              results: [
                {
                  id: "candidate-1",
                  status: "candidate",
                  title: "Candidate",
                },
              ],
            }),
          };
        },
      },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).discoveries, [
    { id: "candidate-1", status: "candidate", title: "Candidate" },
  ]);
});

test("automation can update an under-review record without changing its status", async () => {
  const prepared = [];
  const current = {
    id: "review-1",
    status: "under_review",
    title: "Review title",
    summary: "Old summary",
    field: "Science",
    ai_system: "Luna",
    source_label: "Primary paper",
    source_type: "Preprint",
    verification_note: "Open checks remain.",
    evidence_level: "preprint_experimental",
    discovery_type: "discovery",
    validation_stage: "author_reported_experimental",
    why_it_matters: "Old significance.",
    ai_role_plain: "Old role.",
  };
  const response = await worker.fetch(
    new Request("https://example.test/api/automation/discoveries/review-1/transition", {
      method: "PATCH",
      headers: {
        authorization: "Bearer automation-test",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        note: "Primary source was rechecked; the summary is clearer.",
        summary: "New plain-language summary.",
      }),
    }),
    {
      AUTOMATION_TOKEN: "automation-test",
      DB: {
        prepare(sql) {
          return {
            bind(...args) {
              prepared.push({ sql, args });
              return {
                first: async () => (sql.includes("SELECT") ? current : undefined),
              };
            },
          };
        },
        batch: async () => [{ meta: { changes: 1 } }, { meta: { changes: 1 } }],
      },
    },
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, "under_review");
  assert.equal(
    prepared.some(({ args }) => args.includes("luna-max-automation")),
    true,
  );
});

test("classification rejects unknown taxonomy values", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/api/editorial/discoveries/example/classification", {
      method: "PATCH",
      headers: {
        authorization: "Bearer editorial-test",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        discoveryType: "marketing_claim",
        validationStage: "peer_reviewed",
        note: "Testing invalid taxonomy.",
      }),
    }),
    { ...registryEnv([]), EDITORIAL_TOKEN: "editorial-test" },
  );

  assert.equal(response.status, 400);
});

test("a verified record cannot be reclassified to a weak validation stage", async () => {
  const response = await worker.fetch(
    new Request("https://example.test/api/editorial/discoveries/example/classification", {
      method: "PATCH",
      headers: {
        authorization: "Bearer editorial-test",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        discoveryType: "proof",
        validationStage: "author_checked",
        note: "Testing weak-stage guard.",
      }),
    }),
    {
      EDITORIAL_TOKEN: "editorial-test",
      DB: {
        prepare() {
          return {
            bind() {
              return {
                first: async () => ({
                  id: "example",
                  status: "verified",
                  discovery_type: "proof",
                  validation_stage: "expert_checked",
                }),
              };
            },
          };
        },
      },
      ASSETS: {
        fetch: async () => new Response("missing", { status: 404 }),
      },
    },
  );

  assert.equal(response.status, 409);
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

test("primary-source feed parsers normalize canonical records", () => {
  assert.deepEqual(
    parseBiorxivEntries(
      {
        collection: [
          {
            doi: "10.1101/2025.09.12.675911",
            title: "Generative design of novel bacteriophages",
            abstract: "<p>Language models generated viable phages.</p>",
            date: "2025-09-17",
            category: "Microbiology",
          },
        ],
      },
      "biorxiv",
    ),
    [
      {
        externalId: "10.1101/2025.09.12.675911",
        sourceUrl: "https://doi.org/10.1101/2025.09.12.675911",
        title: "Generative design of novel bacteriophages",
        summary: "Language models generated viable phages.",
        announcedAt: "2025-09-17",
        field: "Microbiology",
      },
    ],
  );

  assert.deepEqual(
    parsePubmedEntries({
      result: {
        uids: ["42561074"],
        "42561074": {
          title: "Generative design of bacteriophages with genome language models.",
          fulljournalname: "Science (New York, N.Y.)",
          pubdate: "2026 Aug 06",
          articleids: [{ idtype: "doi", value: "10.1126/science.aec2657" }],
        },
      },
    }),
    [
      {
        externalId: "pmid-42561074",
        sourceUrl: "https://doi.org/10.1126/science.aec2657",
        title: "Generative design of bacteriophages with genome language models.",
        summary:
          "PubMed-indexed research record in Science (New York, N.Y.); the primary article and abstract require editorial review.",
        announcedAt: "2026-08-06",
        field: "Science (New York, N.Y.)",
        sourceScreened: true,
      },
    ],
  );

  assert.deepEqual(
    parseCrossrefEntries({
      message: {
        items: [
          {
            DOI: "10.1126/science.aec2657",
            title: ["Generative design of bacteriophages with genome language models"],
            abstract: "<jats:p>Experimental testing yielded 16 phages.</jats:p>",
            published: { "date-parts": [[2026, 8, 6]] },
            type: "journal-article",
            "container-title": ["Science"],
          },
        ],
      },
    }),
    [
      {
        externalId: "10.1126/science.aec2657",
        sourceUrl: "https://doi.org/10.1126/science.aec2657",
        title: "Generative design of bacteriophages with genome language models",
        summary: "Experimental testing yielded 16 phages.",
        announcedAt: "2026-08-06",
        field: "Science",
      },
    ],
  );
});

test("primary-source feed queries are bounded by the shared date window", () => {
  const now = new Date("2026-08-07T12:00:00Z");
  const env = { INTAKE_LOOKBACK_DAYS: "7", INTAKE_MAX_RESULTS: "9" };
  assert.match(buildBiorxivUrl("biorxiv", now, env), /2026-07-31\/2026-08-07\/0$/);
  const pubmed = new URL(buildPubmedSearchUrl(now, env));
  assert.equal(pubmed.searchParams.get("retmax"), "9");
  assert.match(pubmed.searchParams.get("term"), /2026-07-31/);
  const crossref = new URL(buildCrossrefUrl(now, env));
  assert.equal(crossref.searchParams.get("rows"), "9");
  assert.match(crossref.searchParams.get("filter"), /from-pub-date:2026-07-31/);
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

test("candidate intake is safe-off and reports that public records cannot change", async () => {
  const response = await runCandidateIntake({ INTAKE_ENABLED: "false" });
  assert.deepEqual(response, {
    mode: "candidate_only",
    publicRecordsChanged: 0,
    status: "disabled",
    candidatesSeen: 0,
    candidatesAdded: 0,
  });
});

test("candidate intake can add a screened PubMed record without publishing it", async () => {
  const originalFetch = globalThis.fetch;
  const statements = [];
  const bindings = [];
  globalThis.fetch = async (url) => {
    if (String(url).includes("esearch.fcgi")) {
      return new Response(JSON.stringify({ esearchresult: { idlist: ["42561074"] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({
        result: {
          uids: ["42561074"],
          "42561074": {
            title: "Generative design of bacteriophages with genome language models.",
            fulljournalname: "Science",
            pubdate: "2026 Aug 06",
            articleids: [{ idtype: "doi", value: "10.1126/science.aec2657" }],
          },
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  const env = {
    INTAKE_ENABLED: "true",
    INTAKE_SOURCES: "pubmed-discovery-scan",
    INTAKE_MAX_RESULTS: "1",
    DB: {
      prepare(sql) {
        statements.push(sql);
        return {
          bind(...args) {
            bindings.push({ sql, args });
            return {
              first: async () => null,
              run: async () => ({ meta: { changes: 1 } }),
            };
          },
        };
      },
    },
  };

  try {
    const response = await runCandidateIntake(env, new Date("2026-08-07T12:00:00Z"));
    assert.equal(response.status, "completed");
    assert.equal(response.publicRecordsChanged, 0);
    assert.equal(response.candidatesSeen, 1);
    assert.equal(response.candidatesAdded, 1);
    assert.equal(response.sources[0].sourceKey, "pubmed-discovery-scan");
    const insert = bindings.find(({ sql }) => sql.includes("INSERT OR IGNORE INTO discoveries"));
    assert.ok(insert);
    assert.equal(insert.args.includes("candidate-pubmed-pmid-42561074"), true);
    assert.equal(statements.some((sql) => sql.includes("INSERT OR IGNORE INTO intake_runs")), true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("candidate intake skips an overlapping source scan", async () => {
  const statements = [];
  const env = {
    INTAKE_ENABLED: "true",
    DB: {
      prepare(sql) {
        statements.push(sql);
        return {
          bind() {
            return {
              run: async () => ({
                meta: { changes: sql.includes("INSERT OR IGNORE INTO intake_runs") ? 0 : 1 },
              }),
            };
          },
        };
      },
    },
  };

  const response = await runCandidateIntake(env, new Date("2026-08-02T10:17:00Z"));
  assert.equal(response.mode, "candidate_only");
  assert.equal(response.publicRecordsChanged, 0);
  assert.equal(response.status, "skipped");
  assert.equal(response.reason, "source_scan_already_running");
  assert.equal(response.candidatesSeen, 0);
  assert.equal(response.candidatesAdded, 0);
  assert.deepEqual(
    response.sources.map((source) => source.sourceKey),
    [
      "arxiv-discovery-scan",
      "biorxiv-discovery-scan",
      "medrxiv-discovery-scan",
      "pubmed-discovery-scan",
      "crossref-discovery-scan",
    ],
  );
  assert.equal(statements.some((sql) => sql.includes("UPDATE intake_runs")), true);
  assert.equal(statements.some((sql) => sql.includes("INSERT OR IGNORE INTO intake_runs")), true);
});

test("emits the files required by the Vercel static deployment", async () => {
  await access(new URL("../dist/client/index.html", import.meta.url));
  await access(new URL("../dist/client/about/index.html", import.meta.url));
  await access(new URL("../dist/client/method/index.html", import.meta.url));
  await access(new URL("../dist/client/how-it-works/index.html", import.meta.url));
});
