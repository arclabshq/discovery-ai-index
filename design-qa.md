# Discovery Index mobile leaderboard design QA

## Findings

- No P0, P1, or P2 issues remain.
- The compact mobile list is an intentional responsive change: desktop retains the editorial cards, while mobile uses a numbered, expandable index optimized for scanning.

## Source and implementation

- Source visual truth: `/Users/alexreeder/Documents/Codex/2026-07-23/realtime-voice-chat/outputs/discovery-index/qa/mobile-leaderboard-source-v9.png`
- Final collapsed implementation: `/Users/alexreeder/Documents/Codex/2026-07-23/realtime-voice-chat/outputs/discovery-index/qa/mobile-leaderboard-collapsed-v2.png`
- Source card focus: `/Users/alexreeder/Documents/Codex/2026-07-23/realtime-voice-chat/outputs/discovery-index/qa/mobile-leaderboard-source-card-focus.png`
- Expanded implementation focus: `/Users/alexreeder/Documents/Codex/2026-07-23/realtime-voice-chat/outputs/discovery-index/qa/mobile-leaderboard-expanded.png`
- Full-view comparison: `/Users/alexreeder/Documents/Codex/2026-07-23/realtime-voice-chat/outputs/discovery-index/qa/mobile-leaderboard-comparison.png`
- Focused record comparison: `/Users/alexreeder/Documents/Codex/2026-07-23/realtime-voice-chat/outputs/discovery-index/qa/mobile-leaderboard-focus-comparison.png`
- Desktop preservation check: `/Users/alexreeder/Documents/Codex/2026-07-23/realtime-voice-chat/outputs/discovery-index/qa/mobile-leaderboard-desktop-preserved.png`

The source and implementation captures are both 390 × 844 pixels at a 390 × 844 CSS-pixel viewport and device pixel ratio 1. Comparison canvases are 700 × 700 pixels. The desktop check is 1440 × 1000.

## Required fidelity surfaces

- **Fonts and typography:** The existing Georgia editorial hierarchy and sans-serif metadata remain intact. Mobile result titles are reduced to 19px so a row scans quickly without losing the publication character.
- **Spacing and layout rhythm:** The hero, filter, verification key, and 625px registry start position are preserved. The former 234px first summary was tightened to 191px, allowing the model and significance to remain visible without recreating a full card.
- **Colors and visual tokens:** Ivory, navy, cobalt, cool-gray borders, verified-blue status styling, and focus-ring tokens remain consistent with the existing site.
- **Image quality and assets:** This component contains no new imagery. Existing brand treatment is unchanged, and no image or icon asset was replaced with a code-drawn substitute.
- **Copy and content:** Every collapsed row shows field, date, result-first title, a shortened visible significance statement, AI system, and textual verification status. Expanded rows reveal the full discovery summary, AI contribution, and primary source.

## Interaction, accessibility, and responsive checks

- Mobile renders one ordered list of six native `<details>` rows; desktop cards and the desktop table are not duplicated in the mobile accessibility tree.
- Visible numbering is marked as reference position, not importance: “Newest first · Reference numbers, not rankings.”
- The first row opens and closes with click, Enter, and Space. Focus remains on the native `<summary>`.
- The Medicine filter returns one row for halicin; restoring All fields returns all six. A polite result-count message supports assistive technology.
- Status is communicated with the text “Verified,” not color alone.
- At 390px and 320px widths, document width equals viewport width with no horizontal overflow.
- At 1440px, six editorial cards render and the mobile leaderboard is absent.
- Expanded content keeps the source link outside the summary, avoiding nested interactive controls.
- Browser console warning/error check after expansion returned no entries.
- Build and all nine worker/API tests pass.

## Comparison history

1. The first leaderboard pass preserved too much card density: its first collapsed summary measured 234px tall.
2. Result title size, row gaps, padding, and the significance preview were tightened.
3. The revised row measures 191px, keeps the complete interaction model, and passes the full and focused comparisons.

## Follow-up polish

- VoiceOver’s exact phrasing should receive a manual device pass when the site has a broader accessibility testing cycle.

final result: passed
