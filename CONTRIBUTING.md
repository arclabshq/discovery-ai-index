# Contributing

Discovery AI Index welcomes corrections, stronger primary evidence, and candidate discoveries.

## Proposing a record or correction

Open an issue with:

- the original paper, proof, dataset, code, or official technical report;
- the specific new result in plain language;
- how AI materially contributed;
- the strongest completed independent check;
- material limitations, contradictory evidence, corrections, or retractions.

Do not include private data, embargoed research, API keys, access tokens, or copyrighted paper text.
Link to third-party research instead of copying it into the repository.

## Code changes

1. Create a branch or fork.
2. Run `npm ci`.
3. Make a focused change.
4. Run `npm run check` and `npm audit --audit-level=high`.
5. Open a pull request explaining the user-visible and data-safety impact.

Pull requests never receive production secrets, write to the live D1 database, deploy the site, or
change a discovery's public status. Schema, taxonomy, publishing rules, security controls, and
automation permissions require explicit human review.
