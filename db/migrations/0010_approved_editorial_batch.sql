-- Approved editorial batch: five private candidates and two evidence updates.
-- Candidate rows remain excluded from all public APIs until an authenticated
-- editor moves them through the existing editorial workflow.

INSERT OR IGNORE INTO discoveries (
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
  discovery_type,
  validation_stage,
  why_it_matters,
  ai_role_plain,
  review_started_at,
  published_at,
  intake_source,
  external_id,
  last_seen_at,
  created_at,
  updated_at
) VALUES
  (
    'candidate-pevac-ps',
    'pevac-ps-pan-sarbecovirus-vaccine',
    'An AI-designed pan-sarbecovirus vaccine reaches a first human trial',
    'A phase I, needle-free dose-escalation trial tested pEVAC-PS, a computationally designed vaccine antigen intended to cover SARS, SARS-CoV-2, and related sarbecoviruses. The study enrolled 39 healthy volunteers; the vaccine was well tolerated and produced measurable responses, but efficacy and broad protection remain untested.',
    'Medicine',
    'DIOSynVax computational vaccine-design pipeline',
    'candidate',
    '2026-06-05',
    NULL,
    'https://pubmed.ncbi.nlm.nih.gov/42155675/',
    'Journal of Infection research article',
    'Peer-reviewed paper',
    'The phase I paper reports 39 volunteers, no significant safety concerns, and measurable responses to conserved sarbecovirus epitopes. Interpretation of immunogenicity was limited by pre-existing immunity and heterogeneous exposure histories; larger phase II studies are still needed.',
    'peer_reviewed_human_experimental',
    'translation',
    'human_trial',
    'A vaccine that covers a virus family rather than a single known strain could reduce the need to chase variants and improve preparedness for zoonotic sarbecoviruses, if larger studies confirm breadth and protection.',
    'Machine-learning and sequence-analysis methods designed the PanSarbeco antigen; researchers selected the candidate, ran the dose-escalation study, and interpreted the human data.',
    NULL,
    NULL,
    'editorial_research',
    '10.1016/j.jinf.2026.106759',
    '2026-08-05',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'candidate-syntnpb',
    'syntnpb-ai-designed-rna-guided-nucleases',
    'AI designs compact RNA-guided nucleases beyond natural sequences',
    'An evolution- and structure-guided design model generated synthetic TnpB variants. Screening found active SynTnpBs that retained or exceeded reference activity in bacterial, plant, and human cells; cryo-EM of a divergent variant showed stabilizing contacts.',
    'Biology',
    'Evolution- and structure-guided inverse-folding model',
    'candidate',
    '2026-07-16',
    NULL,
    'https://doi.org/10.1126/science.aed6123',
    'Science research article',
    'Peer-reviewed paper',
    'The paper reports high-throughput screening, activity in bacterial, plant, and human cells, and cryo-EM analysis of a divergent SynTnpB. Editing performance, delivery, and in-vivo safety remain open questions.',
    'peer_reviewed_experimental',
    'design',
    'human_cell_study',
    'Compact programmable nucleases could expand the gene-editing toolbox and make delivery easier, but the reported experiments do not establish therapeutic or agricultural safety.',
    'A structure-guided inverse-folding model combined with evolutionary constraints to propose divergent TnpB sequences; researchers screened, characterized, and structurally analyzed the resulting proteins.',
    NULL,
    NULL,
    'editorial_research',
    '10.1126/science.aed6123',
    '2026-08-05',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'candidate-gonorrhea-antibiotics',
    'deep-learning-gonorrhea-antibiotic-candidates',
    'Deep learning finds antibiotic candidates against drug-resistant gonorrhea',
    'Researchers phenotypically tested 38,650 small molecules to train a graph neural network, then screened about six million compounds. Of 213 selected for experimental validation, 83 inhibited Neisseria gonorrhoeae; two structurally distinct candidates were active against multidrug-resistant strains and showed early promise in human-vagina-on-chip and mouse models.',
    'Medicine',
    'Predictive graph neural network',
    'candidate',
    '2026-06-22',
    NULL,
    'https://pubmed.ncbi.nlm.nih.gov/42308330/',
    'Science Translational Medicine research article',
    'Peer-reviewed paper',
    'The study reports laboratory activity against multidrug-resistant strains and early activity in a human-vagina-on-chip model and mouse vaginal infection model. The candidates are discovery leads, not approved or clinically tested treatments.',
    'peer_reviewed_experimental',
    'discovery',
    'animal_study',
    'New antibiotics with mechanisms distinct from current drugs could help address rising resistance, but the candidates still need optimization, safety testing, and human trials.',
    'A graph neural network learned from a phenotypic screen, ranked approximately six million virtual compounds, and prioritized molecules for laboratory and infection-model testing.',
    NULL,
    NULL,
    'editorial_research',
    '10.1126/scitranslmed.ads4699',
    '2026-08-05',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'candidate-raven-exoplanets',
    'raven-tess-exoplanet-validation',
    'RAVEN validates 118 exoplanets in TESS data',
    'RAVEN searched TESS Full Frame Images covering more than 2.2 million main-sequence stars. Its machine-learning vetting and statistical validation newly validated 118 planets, including 31 newly detected there, while flagging more than 2,000 additional high-probability candidates.',
    'Astronomy',
    'RAVEN machine-learning pipeline',
    'candidate',
    '2026-03-23',
    NULL,
    'https://arxiv.org/abs/2603.22597',
    'arXiv preprint accepted for MNRAS',
    'Author preprint',
    'The preprint reports statistical validation of 118 planets and says the paper was accepted for publication in MNRAS. The additional candidates are not validated planets and require follow-up or further vetting.',
    'preprint_statistical_validation',
    'discovery',
    'statistical_validation',
    'A more complete and less biased planet census improves studies of planetary populations and gives observing teams a larger, better-prioritized follow-up list.',
    'Machine-learning models trained with realistic simulations classified transit candidates and supported the pipeline''s statistical validation and false-positive rejection.',
    NULL,
    NULL,
    'editorial_research',
    'arXiv:2603.22597',
    '2026-08-05',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'candidate-jamming-exponents',
    'claude-jamming-exponents-proof',
    'Claude-assisted proof establishes a long-standing jamming identity',
    'A paper gives an analytic proof of the identity a+b=1 for critical exponents in the full replica-symmetry-breaking theory of dense hard spheres, a relation previously supported numerically. The authors say the proof was developed through interaction with Claude Sonnet 4.6 and Opus 4.7 and verified by them.',
    'Physics',
    'Claude Sonnet 4.6 and Opus 4.7',
    'candidate',
    '2026-06-02',
    NULL,
    'https://doi.org/10.1088/1742-5468/ae7bd7',
    'Journal of Statistical Mechanics research article',
    'Peer-reviewed paper',
    'The authors describe an analytic proof of a relation that had previously been supported numerically and say they verified the final argument. The record should distinguish the authors'' mathematical judgment and verification from the model interaction used during proof development.',
    'peer_reviewed_formal_check',
    'proof',
    'peer_reviewed',
    'The identity closes a gap in a central theory of jamming and connects phase-space and mechanical marginal-stability predictions, while remaining within an idealized infinite-dimensional model.',
    'The authors used Claude during proof development, then selected, corrected, and verified the final mathematical argument.',
    NULL,
    NULL,
    'editorial_research',
    '10.1088/1742-5468/ae7bd7',
    '2026-08-05',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

UPDATE discoveries
SET
  title = 'AI-designed OpenCRISPR-1 edits human cells and rice',
  summary = 'OpenCRISPR-1 was designed from natural CRISPR systems and first tested in human cells. Two 2026 follow-up studies report broader testing in human cells, induced pluripotent stem cells, and fibroblasts, plus knockout, base-editing, and prime-editing activity in rice calli and stable T0 plants.',
  source_label = 'Nature original; Genome Medicine and aBIOTECH follow-ups',
  source_type = 'Peer-reviewed papers',
  verification_note = 'The original Nature study tested generated editors in cultured human cells. A 2026 Genome Medicine study compared OpenCRISPR-1 and derived prime editors across endogenous human loci, iPSCs, and fibroblasts and reported up to a 553-fold reduction in off-target mutations in its tested comparisons. A 2026 aBIOTECH study tested knockout, base editing, and prime editing in rice calli and stable T0 plants. Mammalian in-vivo safety, clinical use, and delivery at therapeutic scale remain untested. Follow-ups: https://doi.org/10.1186/s13073-026-01682-2 and https://pmc.ncbi.nlm.nih.gov/articles/PMC13352068/.',
  evidence_level = 'peer_reviewed_multi_study',
  validation_stage = 'human_cell_study',
  why_it_matters = 'More precise and customizable gene editors could broaden the diseases, crops, and biological questions that genome editing can address, while the new plant and human-cell studies extend the evidence beyond the original demonstration without establishing clinical safety.',
  ai_role_plain = 'Protein language models generated new CRISPR proteins and guide RNAs; later studies tested the resulting editors across human cell types and rice editing systems.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-opencrispr1';

UPDATE discoveries
SET
  source_label = 'OpenAI proof PDF and companion paper',
  source_type = 'Proof package and companion paper',
  verification_note = 'The complete proof was released publicly and checked by a group of external mathematicians, who also published a companion paper explaining the argument and its significance. The companion paper is available at https://arxiv.org/abs/2605.20695. The reasoning model generated the geometric construction; human mathematicians checked and edited the final proof package.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-openai-unit-distance';

INSERT OR IGNORE INTO editorial_events (
  id, discovery_id, from_status, to_status, note, actor, created_at
) VALUES (
  'approved-batch-candidate-pevac-ps',
  'candidate-pevac-ps',
  NULL,
  'candidate',
  'Staged as a private candidate in the approved 2026-08-05 editorial batch; public review remains required.',
  'editorial research',
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO editorial_events (
  id, discovery_id, from_status, to_status, note, actor, created_at
) VALUES (
  'approved-batch-candidate-syntnpb',
  'candidate-syntnpb',
  NULL,
  'candidate',
  'Staged as a private candidate in the approved 2026-08-05 editorial batch; public review remains required.',
  'editorial research',
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO editorial_events (
  id, discovery_id, from_status, to_status, note, actor, created_at
) VALUES (
  'approved-batch-candidate-gonorrhea',
  'candidate-gonorrhea-antibiotics',
  NULL,
  'candidate',
  'Staged as a private candidate in the approved 2026-08-05 editorial batch; public review remains required.',
  'editorial research',
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO editorial_events (
  id, discovery_id, from_status, to_status, note, actor, created_at
) VALUES (
  'approved-batch-candidate-raven',
  'candidate-raven-exoplanets',
  NULL,
  'candidate',
  'Staged as a private candidate in the approved 2026-08-05 editorial batch; public review remains required.',
  'editorial research',
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO editorial_events (
  id, discovery_id, from_status, to_status, note, actor, created_at
) VALUES (
  'approved-batch-candidate-jamming',
  'candidate-jamming-exponents',
  NULL,
  'candidate',
  'Staged as a private candidate in the approved 2026-08-05 editorial batch; public review remains required.',
  'editorial research',
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO editorial_events (
  id, discovery_id, from_status, to_status, note, actor, created_at
) VALUES (
  'approved-batch-update-opencrispr1',
  'disc-opencrispr1',
  'verified',
  'verified',
  'Updated with the 2026 Genome Medicine and aBIOTECH follow-up evidence; publication status unchanged.',
  'editorial research',
  CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO editorial_events (
  id, discovery_id, from_status, to_status, note, actor, created_at
) VALUES (
  'approved-batch-update-unit-distance',
  'disc-openai-unit-distance',
  'verified',
  'verified',
  'Added the companion-paper source trail and clarified the human verification role; publication status unchanged.',
  'editorial research',
  CURRENT_TIMESTAMP
);
