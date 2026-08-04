# Contributor guardrails

The selected Discovery AI Index direction is an ivory-and-cobalt editorial registry: large
serif headlines, restrained rules, compact evidence labels, and amber reserved for
under-review material. Preserve that hierarchy when adding product capabilities.

Discovery AI Index is a public proof layer for curious non-specialists. Lead with the pace and
significance of verified AI-assisted breakthroughs, separate “what changed” from “why it
matters,” and keep abstract-style technical language behind the evidence layer. The global
ticker contains verified breakthrough stories only—field, AI system or lab, and the
plain-language result.

Write the homepage for a visitor seeking concrete examples of research progress, not as an
explanation of why Discovery AI Index exists. Put product rationale and verification mechanics on
About and How it works. In every record, “Why this matters” describes the importance of the
scientific, mathematical, medical, or technical breakthrough itself—not the significance of AI
having contributed to it.

The public product name is Discovery AI Index. Its scope is a global, continuously expanding
catalog of discoveries materially enabled by AI, not a claim that AI worked alone. Classify
records as discovery, proof, design, translation, or research milestone, and separately show
the strongest documented validation stage. Keep one study-level discovery set as one registry
record rather than inflating the count with every object in the set.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

The automated source scan may write only private candidate records, candidate observation metadata,
and intake audit rows. The authenticated Luna Max automation may write structured discovery fields
through the protected automation API, using the existing status transitions and audit events. Neither
automation may edit application source, migrations, taxonomy, thresholds, editorial rules, workflow
permissions, or deployment configuration. Those changes require a human-reviewed code or editorial
change.
