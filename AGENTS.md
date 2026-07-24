# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

The selected Discovery Index direction is an ivory-and-cobalt editorial registry: large
serif headlines, restrained rules, compact evidence labels, and amber reserved for
under-review material. Preserve that hierarchy when adding product capabilities.

Discovery Index is a public proof layer for curious non-specialists. Lead with the pace and
significance of verified AI-assisted breakthroughs, separate “what changed” from “why it
matters,” and keep abstract-style technical language behind the evidence layer. The global
ticker contains verified breakthrough stories only—field, AI system or lab, and the
plain-language result.

Write the homepage for a visitor seeking concrete examples of research progress, not as an
explanation of why Discovery Index exists. Put product rationale and verification mechanics on
About and How it works. In every record, “Why this matters” describes the importance of the
scientific, mathematical, medical, or technical breakthrough itself—not the significance of AI
having contributed to it.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
