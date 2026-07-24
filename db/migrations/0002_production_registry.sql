ALTER TABLE discoveries ADD COLUMN source_label TEXT;
ALTER TABLE discoveries ADD COLUMN source_type TEXT;
ALTER TABLE discoveries ADD COLUMN verification_note TEXT;
ALTER TABLE discoveries ADD COLUMN evidence_level TEXT;
ALTER TABLE discoveries ADD COLUMN why_it_matters TEXT;
ALTER TABLE discoveries ADD COLUMN review_started_at TEXT;
ALTER TABLE discoveries ADD COLUMN published_at TEXT;
ALTER TABLE discoveries ADD COLUMN intake_source TEXT;
ALTER TABLE discoveries ADD COLUMN external_id TEXT;
ALTER TABLE discoveries ADD COLUMN last_seen_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS discoveries_source_url_idx ON discoveries(source_url);
CREATE INDEX IF NOT EXISTS discoveries_external_id_idx ON discoveries(external_id);

CREATE TABLE IF NOT EXISTS editorial_events (
  id TEXT PRIMARY KEY,
  discovery_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'editorial',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (discovery_id) REFERENCES discoveries(id)
);

CREATE INDEX IF NOT EXISTS editorial_events_discovery_idx
  ON editorial_events(discovery_id, created_at DESC);

CREATE TABLE IF NOT EXISTS intake_runs (
  id TEXT PRIMARY KEY,
  source_key TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL,
  candidates_seen INTEGER NOT NULL DEFAULT 0,
  candidates_added INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);

INSERT OR REPLACE INTO discoveries (
  id,
  slug,
  title,
  summary,
  field,
  ai_system,
  status,
  announced_at,
  verified_at,
  source_url,
  source_label,
  source_type,
  verification_note,
  evidence_level,
  why_it_matters,
  review_started_at,
  published_at,
  updated_at
) VALUES
  (
    'disc-halicin',
    'halicin-antibiotic',
    'A neural network surfaces halicin as an antibiotic',
    'Researchers trained a molecular graph neural network to look for antibacterial activity, then used it to identify halicin, a compound unlike conventional antibiotics. The team confirmed activity in laboratory tests and mouse infection models.',
    'Medicine',
    'Directed-message-passing neural network',
    'verified',
    '2020-02-20',
    '2020-02-20',
    'https://doi.org/10.1016/j.cell.2020.01.021',
    'Cell research article',
    'Peer-reviewed paper',
    'Peer reviewed; the reported antibacterial activity was tested in laboratory and mouse infection models.',
    'peer_reviewed_experimental',
    'It showed that machine learning could search unfamiliar chemical space, while experiments—not the model alone—decided whether the lead was real.',
    '2020-02-20',
    '2020-02-20',
    CURRENT_TIMESTAMP
  ),
  (
    'disc-alphafold2',
    'alphafold2-protein-structures',
    'AlphaFold reaches near-experimental protein-structure accuracy',
    'AlphaFold predicted three-dimensional protein structures from amino-acid sequences with accuracy competitive with experiments for many targets in the blind CASP14 benchmark.',
    'Biology',
    'AlphaFold2',
    'verified',
    '2021-07-15',
    '2021-07-15',
    'https://doi.org/10.1038/s41586-021-03819-2',
    'Nature research article',
    'Peer-reviewed paper',
    'Peer reviewed and tested in CASP14, a blind community benchmark using structures that were not publicly available to participants.',
    'peer_reviewed_benchmark',
    'Reliable structure predictions can shorten the path from a protein sequence to a testable biological hypothesis.',
    '2021-07-15',
    '2021-07-15',
    CURRENT_TIMESTAMP
  ),
  (
    'disc-alphatensor',
    'alphatensor-matrix-multiplication',
    'AlphaTensor finds faster matrix-multiplication algorithms',
    'A reinforcement-learning system searched for ways to multiply matrices and found algorithms that improved on known methods for several matrix sizes, including results tailored to specific computer hardware.',
    'Computer science',
    'AlphaTensor',
    'verified',
    '2022-10-05',
    '2022-10-05',
    'https://doi.org/10.1038/s41586-022-05172-4',
    'Nature research article',
    'Peer-reviewed paper',
    'Peer reviewed; candidate algorithms were checked against exact matrix-multiplication identities and benchmarked by the authors.',
    'peer_reviewed_formal_check',
    'Matrix multiplication sits inside much of modern computing, so even specialized improvements can have broad downstream value.',
    '2022-10-05',
    '2022-10-05',
    CURRENT_TIMESTAMP
  ),
  (
    'disc-gnome',
    'gnome-stable-materials',
    'GNoME expands the map of computationally stable crystals',
    'Graph neural networks filtered possible crystal structures before density-functional-theory calculations checked them. The study reported 381,000 new entries on an updated stability hull; 736 structures matched independently reported syntheses.',
    'Materials science',
    'GNoME',
    'verified',
    '2023-11-29',
    '2023-11-29',
    'https://doi.org/10.1038/s41586-023-06735-9',
    'Nature research article',
    'Peer-reviewed paper',
    'Peer reviewed; model predictions were checked computationally with density-functional theory, and the paper reports 736 matches to independently synthesized structures.',
    'peer_reviewed_computational',
    'A much larger candidate map can help experimental teams decide which materials are worth the cost of trying to make.',
    '2023-11-29',
    '2023-11-29',
    CURRENT_TIMESTAMP
  ),
  (
    'disc-funsearch',
    'funsearch-cap-set-and-bin-packing',
    'FunSearch produces new results in mathematics and algorithms',
    'FunSearch paired a language model with an automated evaluator. It improved a construction for the cap-set problem and found more efficient bin-packing heuristics, with generated programs checked before entering the result pool.',
    'Mathematics',
    'FunSearch',
    'verified',
    '2023-12-14',
    '2023-12-14',
    'https://doi.org/10.1038/s41586-023-06924-6',
    'Nature research article',
    'Peer-reviewed paper',
    'Peer reviewed; outputs were accepted only after executable evaluators checked them, and the mathematical construction is reported in the paper.',
    'peer_reviewed_formal_check',
    'It is an early example of a language model contributing to a result that can be checked independently of the model''s prose.',
    '2023-12-14',
    '2023-12-14',
    CURRENT_TIMESTAMP
  ),
  (
    'review-ai-co-scientist',
    'ai-co-scientist-biomedical-hypotheses',
    'AI co-scientist proposes biomedical hypotheses tested in the lab',
    'A multi-agent system generated hypotheses for drug repurposing, treatment targets, and bacterial gene transfer. The authors report expert-guided wet-lab tests, including activity in cancer cell lines and human liver organoids.',
    'Biomedicine',
    'AI co-scientist (Gemini 2.0)',
    'under_review',
    '2025-02-26',
    NULL,
    'https://arxiv.org/abs/2502.18864',
    'arXiv author preprint',
    'Preprint',
    'Author-reported expert and wet-lab checks are described, but independent review, replication, and the boundaries of the novelty claims remain open.',
    'preprint_experimental',
    'The work tests whether an AI system can help move from literature synthesis to hypotheses that scientists can examine experimentally.',
    '2025-02-26',
    NULL,
    CURRENT_TIMESTAMP
  ),
  (
    'review-alphaevolve',
    'alphaevolve-algorithmic-discovery',
    'AlphaEvolve reports new algorithmic improvements',
    'An evolutionary coding agent reported improved solutions across mathematics and computing, including a procedure for multiplying two 4×4 complex-valued matrices with 48 scalar multiplications.',
    'Mathematics',
    'AlphaEvolve',
    'under_review',
    '2025-06-16',
    NULL,
    'https://arxiv.org/abs/2506.13131',
    'arXiv author technical report',
    'Technical report',
    'The authors describe the results as provably correct, but this registry has not yet recorded journal peer review or an independent verification report.',
    'preprint_formal_claim',
    'The result would extend evaluator-guided AI discovery from narrow demonstrations to a wider set of practical and mathematical problems.',
    '2025-06-16',
    NULL,
    CURRENT_TIMESTAMP
  );

INSERT OR IGNORE INTO editorial_events (
  id,
  discovery_id,
  from_status,
  to_status,
  note,
  actor,
  created_at
)
SELECT
  'seed-' || id,
  id,
  'under_review',
  'verified',
  verification_note,
  'founding editorial review',
  verified_at
FROM discoveries
WHERE status = 'verified';

