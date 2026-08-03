ALTER TABLE discoveries
ADD COLUMN ai_role_plain TEXT NOT NULL DEFAULT '';

UPDATE discoveries
SET
  title = 'A nearly 80-year-old geometry conjecture is disproved',
  why_it_matters = 'The proof overturns a core assumption in geometry and gives mathematicians a new way to study dense geometric patterns.',
  ai_role_plain = 'The reasoning model generated the geometric construction; the proof can then be checked line by line.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-openai-unit-distance';

UPDATE discoveries
SET
  title = 'New records improve point arrangements and real-time packing',
  why_it_matters = 'The work advances a long-standing math problem and could reduce wasted space and time in scheduling, storage, and logistics.',
  ai_role_plain = 'A language model proposed candidate programs, while an automated evaluator kept only results that passed exact checks.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-funsearch';

UPDATE discoveries
SET
  title = '381,000 potentially stable crystal structures are catalogued',
  ai_role_plain = 'Graph neural networks predicted promising crystal structures, narrowing the candidates sent to more expensive computational checks.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-gnome';

UPDATE discoveries
SET
  title = 'Faster ways to multiply certain matrices are discovered',
  ai_role_plain = 'A reinforcement-learning system searched for new multiplication procedures whose correctness could be checked mathematically.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-alphatensor';

UPDATE discoveries
SET
  title = 'Protein shapes are predicted with near-experimental accuracy',
  ai_role_plain = 'AlphaFold2 predicted three-dimensional protein structures directly from amino-acid sequences.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-alphafold2';

UPDATE discoveries
SET
  title = 'Halicin shows promise against drug-resistant bacteria',
  ai_role_plain = 'A neural network ranked existing molecules for antibacterial potential, surfacing halicin for laboratory and mouse testing.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-halicin';

UPDATE discoveries
SET
  title = 'A proof is proposed for Sun’s number-theory conjecture',
  why_it_matters = 'If confirmed, the proof would settle a question about recurring prime-number patterns and offer a method that may apply to related problems.',
  ai_role_plain = 'ChatGPT generated the central proof presented in the preprint; the authors report checking each step.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'review-chatgpt-sun-conjecture';

UPDATE discoveries
SET
  title = 'A faster matrix-multiplication method is reported',
  ai_role_plain = 'AlphaEvolve proposed and refined algorithms while automated evaluators tested their correctness and performance.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'review-alphaevolve';

UPDATE discoveries
SET
  title = 'Early experiments point to new leads in leukemia, liver disease, and antibiotic resistance',
  ai_role_plain = 'The AI co-scientist generated and prioritized hypotheses that researchers then tested in cells, organoids, or earlier experimental data.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'review-ai-co-scientist';
