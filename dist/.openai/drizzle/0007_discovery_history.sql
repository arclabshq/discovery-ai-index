ALTER TABLE discoveries
ADD COLUMN history_start_label TEXT;

ALTER TABLE discoveries
ADD COLUMN history_start_date TEXT;

ALTER TABLE discoveries
ADD COLUMN history_result_label TEXT;

ALTER TABLE discoveries
ADD COLUMN history_duration_label TEXT;

ALTER TABLE discoveries
ADD COLUMN history_source_url TEXT;

UPDATE discoveries
SET
  history_start_label = 'Conjecture published',
  history_start_date = '2024-05-06',
  history_result_label = 'Proof preprint posted',
  history_duration_label = '776 days',
  history_source_url = 'https://arxiv.org/abs/2405.03626',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'review-chatgpt-sun-conjecture';

UPDATE discoveries
SET
  history_start_label = 'Conjecture published',
  history_start_date = '1946-05-01',
  history_result_label = 'Disproof released',
  history_duration_label = '80 years',
  history_source_url = 'https://doi.org/10.1080/00029890.1946.11991674',
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'disc-openai-unit-distance';
