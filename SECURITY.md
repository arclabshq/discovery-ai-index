# Security policy

Please report security issues privately through GitHub's security-advisory feature for this
repository. Do not open a public issue for vulnerabilities, exposed credentials, authentication
bypasses, or unpublished candidate data.

Supported code is the current `main` branch and the version deployed at
<https://www.discoveryindex.arclabshq.com>.

The application is designed to fail closed: intake, human editorial writes, and Luna Max automation
use separate tokens; private candidates are excluded from public APIs; and automated intake cannot
publish, delete, or bypass the editorial workflow.

`AUTOMATION_TOKEN` is a production secret for structured data transitions only. The local Codex
automation reads its copy from the macOS keychain through `scripts/luna-automation.mjs`; it is not
stored in Git, the site bundle, or the model prompt.
