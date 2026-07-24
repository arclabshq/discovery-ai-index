# Discovery Index design QA

## Findings

- No P0, P1, or P2 visual or interaction issues remain.
- The reader-first implementation intentionally simplifies the original navigation, replaces the meta-explanation section with the first verified record, and makes the discovery itself the dominant content.

## Source and implementation

- Source feedback screenshot: `/Users/alexreeder/Documents/Codex/2026-07-23/realtime-voice-chat/outputs/discovery-index/qa/source-feedback-mobile.png`
- Implementation screenshot: `/Users/alexreeder/Documents/Codex/2026-07-23/realtime-voice-chat/outputs/discovery-index/qa/reader-first-mobile-v2.png`
- Focused record screenshot: `/Users/alexreeder/Documents/Codex/2026-07-23/realtime-voice-chat/outputs/discovery-index/qa/reader-first-mobile-card.png`
- Desktop implementation screenshot: `/Users/alexreeder/Documents/Codex/2026-07-23/realtime-voice-chat/outputs/discovery-index/qa/reader-first-desktop.png`
- Direct side-by-side comparison: `/Users/alexreeder/Documents/Codex/2026-07-23/realtime-voice-chat/outputs/discovery-index/qa/reader-first-comparison.png`

Both mobile source images are 390 × 844 pixels. Browser verification used a 390 × 844 CSS-pixel viewport at device pixel ratio 1; the desktop pass used 1440 × 1000.

## Comparison

- Preserved: ivory-and-cobalt editorial identity, serif display typography, evidence-first tone, breakthrough ticker, and prominent field filtering.
- Improved: shorter navigation, a single clear reader promise, first verified record visible in the initial mobile viewport, result-first story structure, and explicit separation of discovery significance from the AI contribution.
- Intentional delta: the explanatory “See the pace / Understand the significance / Trace the proof” block is removed from the homepage because it explained the product instead of helping a visitor understand a discovery.
- Focused region: the record view was checked independently to confirm the order “What was discovered → Why this matters → How AI helped → Evidence.”

## Interaction and responsive checks

- Story view is the default and renders six verified cards without also rendering the table to assistive technology.
- Table view conditionally replaces story view and preserves field filtering.
- The Medicine filter returns one matching record; restoring All fields returns all six.
- `/how-it-works` loads directly with the “How we verify” title and three verification steps.
- `/about`, `/for-researchers`, and `/newsroom` remain direct-linkable production routes.
- At 390 pixels wide, document width equals viewport width and the first record begins at 625 pixels, with no horizontal overflow.
- At 1440 pixels wide, document width equals viewport width and the two-column story grid remains scan-friendly.
- A fresh browser load rendered all six records and direct route checks completed without a visible runtime failure. Worker and API tests provide the automated error check for the packaged build.

## Comparison history

1. The first mobile implementation placed the first record below the initial viewport.
2. The duplicate mobile section heading, deck, and view toggle were removed.
3. The final mobile pass brought the first record to 625 pixels while retaining filtering, verification context, and evidence access.

## Follow-up polish

- Replace the temporary circular brand mark when a final identity asset exists.

final result: passed
