# Discovery Index mobile hero and Method design QA

## Findings

- No actionable P0, P1, or P2 issues remain.
- The reported mobile status-strip overflow is resolved. The status content now stays within the viewport and the hero immediately follows it.
- The Method page is intentionally simplified from process language to two status definitions and three evidence questions.

## Source and implementation

- Source visual truth: `/tmp/codex-remote-attachments/019f91fa-3dbe-7233-9033-49ce629ac516/BAD4CC45-B25D-479D-B035-7FFD4BBCF8A8/1-Photo-1.jpg`
- Preserved source copy: `qa/mobile-source-bug.jpg`
- Corrected homepage: `qa/mobile-home-fixed.png`
- Simplified Method page: `qa/mobile-method-fixed.png`
- Full-view comparison: `qa/mobile-hero-status-comparison.png`

The reported screenshot is 589 × 1280 pixels and includes mobile Safari chrome. It was normalized to a 393px-wide comparison column. The implementation captures are 393 × 852 pixels at a 393 × 852 CSS-pixel viewport and device pixel ratio 1. The comparison judges the app-owned status strip, hero, copy, filter, and legend rather than browser chrome.

State: registry ready with nine public records, six verified and three under review.

## Full-view comparison evidence

The combined comparison shows the reported status contents pushed beyond the right edge with a large blank region below. In the corrected capture, the same status information wraps into a compact 102px-high block, the hero begins immediately below it, and the document width equals the 393px viewport width.

## Focused comparison evidence

The homepage comparison is legible enough to inspect the affected status strip, hero, supporting copy, filter, and legend without another crop. The Method request was written rather than shown in the source image, so `qa/mobile-method-fixed.png` is the focused evidence: it shows the new two-status explanation and the beginning of the orange definition at the same mobile viewport.

## Required fidelity surfaces

- **Fonts and typography:** Existing Georgia display typography and sans-serif metadata are preserved. The hero hierarchy and wrapping remain editorial and readable at 393px.
- **Spacing and layout rhythm:** The status strip uses a true mobile column layout with a full-width content row. The hero starts at 223px with no unintended blank region. The Method page keeps deliberate editorial spacing between the explanation and status definitions.
- **Colors and visual tokens:** Ivory, navy, cobalt, cool-gray rules, verified blue, and under-review orange remain unchanged and retain their semantic meaning.
- **Image quality and assets:** No page image asset was missing; the reported failure was layout overflow in the hero-adjacent status strip. No image, logo, or icon was replaced.
- **Copy and content:** The homepage now says what readers gain: what changed, why it matters, and where the evidence comes from. “Plain English” is removed. Method now defines orange and blue directly, then asks what changed, how AI helped, and how the result was checked.

## Interaction, accessibility, and responsive checks

- The document `scrollWidth` and `clientWidth` both measure 393px; there is no horizontal overflow.
- The status strip computes to `flex-direction: column`, with its content measuring 353px inside the 393px viewport.
- The Field control filters Mathematics to four records: two verified and two under review.
- The primary Method navigation link opens the simplified Method page and exposes the expected heading.
- Status is communicated with text as well as color.
- Browser console error check returned no entries.
- Build and all nine Worker/API tests pass.

## Comparison history

1. Reported state: the mobile status strip remained a single desktop flex row. Its label consumed the row width and pushed the status content off-screen, producing a large blank block before the hero.
2. Fix: the mobile status strip now stacks vertically, and the content receives an explicit full width and zero minimum width.
3. Post-fix evidence: `qa/mobile-hero-status-comparison.png` shows the status content in bounds, the blank block removed, and the hero restored above the fold. Browser measurements confirm zero horizontal overflow.

## Follow-up polish

- A physical iPhone Safari pass can confirm safe-area and browser-toolbar behavior, although the responsive layout itself now fits the target width.

final result: passed
