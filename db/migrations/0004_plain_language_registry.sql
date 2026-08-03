UPDATE discoveries
SET
  summary = 'An OpenAI reasoning model found a construction that overturns a long-standing idea about how many pairs of points can sit exactly one unit apart.',
  why_it_matters = 'It shows a general-purpose model contributing a genuinely new mathematical idea that outside experts can check line by line—not merely restating known work.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-openai-unit-distance';

UPDATE discoveries
SET
  summary = 'FunSearch combined a language model with an automatic checker to find a better solution to a long-running mathematics problem and improve a practical packing method.',
  why_it_matters = 'It demonstrates a useful discovery pattern: let AI generate ideas quickly, then keep only the ones that a reliable test can prove work.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-funsearch';

UPDATE discoveries
SET
  summary = 'GNoME predicted hundreds of thousands of crystal structures that computers estimate could be stable, greatly expanding the list of materials scientists can investigate.',
  why_it_matters = 'A larger map of candidate materials could speed the search for improved batteries, solar cells, chips, and other technologies—while lab experiments still decide what works.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-gnome';

UPDATE discoveries
SET
  summary = 'AlphaTensor discovered new ways to multiply matrices, including methods that use fewer steps than previously known for some sizes.',
  why_it_matters = 'Matrix multiplication powers graphics, simulations, and AI itself, so even specialized improvements can make important software run faster and use less energy.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-alphatensor';

UPDATE discoveries
SET
  summary = 'AlphaFold2 predicted the three-dimensional shapes of proteins from their sequences with accuracy close to experiments for many blind-test targets.',
  why_it_matters = 'Protein shape helps explain what a protein does. Faster predictions give scientists a head start when studying disease, designing experiments, and searching for medicines.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-alphafold2';

UPDATE discoveries
SET
  summary = 'A neural network pointed researchers to halicin, an existing compound that lab and mouse tests showed could kill several dangerous bacteria.',
  why_it_matters = 'It showed AI can search chemical possibilities humans might overlook and surface unexpected antibiotic leads—while experiments remain the final test.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-halicin';

UPDATE discoveries
SET
  summary = 'ChatGPT produced the central proof for a number-theory conjecture, and the three paper authors report checking every step themselves.',
  why_it_matters = 'If independently confirmed, it would be a direct example of a general-purpose chatbot generating a new mathematical proof rather than only explaining human work.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'review-chatgpt-sun-conjecture';

UPDATE discoveries
SET
  summary = 'AlphaEvolve reported better solutions across mathematics and computing, including a faster procedure for one kind of matrix multiplication.',
  why_it_matters = 'If independently confirmed, it would show evaluator-guided AI finding useful improvements across a wider range of real mathematical and computing problems.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'review-alphaevolve';

UPDATE discoveries
SET
  summary = 'A Gemini-based multi-agent system proposed biomedical ideas that researchers then tested in cancer cells, human liver organoids, and bacterial experiments.',
  why_it_matters = 'The work asks whether AI can move beyond summarizing research to proposing testable ideas that help scientists choose promising experiments.',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'review-ai-co-scientist';
