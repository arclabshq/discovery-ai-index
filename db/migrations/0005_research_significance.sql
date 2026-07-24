UPDATE discoveries
SET
  summary = 'Mathematicians found an infinite family of point arrangements with more unit-length connections than the square-grid pattern long thought essentially unbeatable, disproving a nearly 80-year-old conjecture.',
  why_it_matters = 'The result changes the map of a central geometry problem and connects it to number theory, giving researchers new tools for understanding dense geometric patterns.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-openai-unit-distance';

UPDATE discoveries
SET
  summary = 'Researchers found record-sized sets of points that avoid three-point lines, along with stronger rules for packing items into containers as they arrive.',
  why_it_matters = 'The results advance a foundational problem in combinatorics and could also reduce wasted capacity in scheduling, storage, and logistics.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-funsearch';

UPDATE discoveries
SET
  summary = 'Researchers catalogued 381,000 new crystal structures predicted to be stable—nearly ten times the previous total—with hundreds matching materials independently produced in laboratories.',
  why_it_matters = 'This much larger map of plausible materials gives scientists more candidates for better batteries, solar cells, electronics, and other technologies, although usefulness and manufacturability still require testing.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-gnome';

UPDATE discoveries
SET
  summary = 'Researchers found provably correct ways to multiply certain matrices using fewer arithmetic steps than the best-known methods, including an improvement to a 50-year-old result.',
  why_it_matters = 'Matrix multiplication underpins graphics, simulations, data analysis, and machine learning, so applicable speedups can reduce computation time and energy.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-alphatensor';

UPDATE discoveries
SET
  summary = 'Researchers achieved near-experimental accuracy when predicting the three-dimensional shapes of many proteins from their amino-acid sequences.',
  why_it_matters = 'A protein’s shape helps reveal what it does and how disease disrupts it, enabling faster experiments and better-informed drug research while still requiring laboratory confirmation.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-alphafold2';

UPDATE discoveries
SET
  summary = 'Halicin, a compound previously investigated for diabetes, was found to kill a range of bacteria—including resistant strains—and successfully treated an infection in mice.',
  why_it_matters = 'Halicin offers a chemically unusual starting point for urgently needed antibiotics against drug-resistant infections, but it is not yet an approved human treatment.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-halicin';

UPDATE discoveries
SET
  summary = 'An author-checked preprint presents a proof of Zhi-Wei Sun’s exact formula for a determinant built from prime-number residue patterns; it has not yet completed independent peer review.',
  why_it_matters = 'If confirmed, the result settles a precise number-theory question and adds a potentially reusable method for evaluating similar mathematical structures.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'review-chatgpt-sun-conjecture';

UPDATE discoveries
SET
  summary = 'A technical report describes new algorithms across mathematics and computing, including a 48-multiplication method for 4×4 complex matrices; independent review remains limited.',
  why_it_matters = 'More efficient foundational algorithms can let data centers, scientific simulations, and other computing systems accomplish more with less time, hardware, and energy.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'review-alphaevolve';

UPDATE discoveries
SET
  summary = 'Early studies report existing drugs that reduced leukemia-cell viability, liver-fibrosis targets that showed activity in human organoids, and a gene-transfer mechanism consistent with earlier experiments.',
  why_it_matters = 'If independently replicated, these findings could open shorter paths to treatments for leukemia and liver disease and improve understanding of how antibiotic resistance spreads.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'review-ai-co-scientist';
