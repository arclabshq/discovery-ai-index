import { useState } from "react";

const stories = [
  { date: "May 14, 2025", title: "AlphaEvolve finds novel algorithms", field: "Computer science", system: "AlphaEvolve", status: "Expert-verified", why: "Better algorithms can speed up the computing that underpins research and industry." },
  { date: "May 19, 2026", title: "AI model of retinal cell organization", field: "Biology", system: "Research agent", status: "Expert-checked", why: "A new line of evidence for future eye-disease research." },
  { date: "Nov 30, 2020", title: "AlphaFold predicts protein structures", field: "Biochemistry", system: "AlphaFold", status: "Established impact", why: "It opened a new path for biological research and drug discovery." },
];

export function App() {
  const [reviewOpen, setReviewOpen] = useState(false);
  return <main className="page">
    <header className="nav">
      <a className="brand" href="#top" aria-label="Discovery Index home"><span className="brand-mark" />Discovery Index</a>
      <nav aria-label="Primary navigation"><a href="#how">How it works</a><a href="#stories">Discoveries</a><a href="#review">Under review</a></nav>
      <button className="explore" onClick={() => document.querySelector("#stories")?.scrollIntoView({ behavior: "smooth" })}>Explore discoveries</button>
    </header>

    <div className="ticker" id="top"><strong>LIVE</strong><span>Updated Jul 23, 2026</span><i /> <span>New evidence added to an AI mathematics result</span></div>

    <section className="intro" id="how">
      <p className="eyebrow">A public record, not a hype feed</p>
      <h1>What did AI actually discover?</h1>
      <p>We track notable AI-assisted discoveries, the evidence behind them, and the people who verify them.</p>
    </section>

    <article className="feature">
      <img src="/assets/hero-geometry.png" alt="Abstract geometric structure connected by fine brass lines" />
      <div className="feature-copy">
        <time>May 20, 2026</time>
        <h2>New bounds in discrete geometry</h2>
        <p>An AI system found a new route through a long-standing problem about how points can be arranged in space.</p>
        <span className="status verified">Expert-verified</span>
        <div className="evidence"><b>Evidence</b><a href="#stories">Plain-English summary</a><a href="#stories">Technical details</a><a href="#stories">Verification report</a></div>
      </div>
    </article>

    <section className="story-list" id="stories" aria-label="Discovery registry">
      {stories.map((story) => <article className="story" key={story.title}>
        <time>{story.date}</time>
        <div><h3>{story.title}</h3><p>{story.field} · {story.system}</p></div>
        <span className="status verified">{story.status}</span>
        <p className="why">{story.why}</p>
        <button aria-label={`Read ${story.title}`}>Read story</button>
      </article>)}
    </section>

    <section className={`review ${reviewOpen ? "open" : ""}`} id="review">
      <time>Jul 23, 2026</time><span className="status reviewing">Under review</span>
      <div><h2>New mathematics result reported</h2><p>{reviewOpen ? "The candidate is being assessed against primary sources, expert feedback, and reproducibility evidence. It is not part of the verified registry yet." : "A new result has been reported. Experts are evaluating the evidence."}</p></div>
      <button onClick={() => setReviewOpen(!reviewOpen)}>{reviewOpen ? "Show less" : "See evaluation"}</button>
    </section>

    <footer><span>Discovery Index</span><span>Every record is public, citable, and permanently archived.</span></footer>
  </main>;
}
