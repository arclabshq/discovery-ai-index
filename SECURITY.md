# Security policy

Please report security issues privately through GitHub's security-advisory feature for this
repository. Do not open a public issue for vulnerabilities, exposed credentials, authentication
bypasses, or unpublished candidate data.

Supported code is the current `main` branch and the version deployed at
<https://discovery-index.alexreeder.chatgpt.site>.

The application is designed to fail closed: intake and editorial writes require separate tokens;
private candidates are excluded from public APIs; and automated intake cannot publish, delete, or
change a public record.
